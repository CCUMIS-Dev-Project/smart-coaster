import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from datetime import datetime, time, timedelta
import pytz

TZ = pytz.timezone('Asia/Taipei')
MIN_TRAINING_SAMPLES = 15
MERGE_WINDOW_MINUTES = 5       # 5 分鐘內的連續飲水合併（防感測器抖動）
MAX_GAP_MINUTES = 480
MIN_GAP_MINUTES = 5            # 最短有效間隔（過濾噪音）
MIN_VOLUME_ML = 5              # 最小有效飲水量，與硬體門檻一致（main.py > 5ml）


# ──────────────────────────────────────────────
# Part 1: 每日飲水目標（醫學公式）
# ──────────────────────────────────────────────
class DailyGoalCalculator:
    """
    基於 NIH / EFSA 醫學標準計算每日建議飲水量。
    公式：weight(kg) × 33ml × 活動修正 × 溫度修正 × 濕度修正
    """

    @staticmethod
    def calculate(
        weight_kg: float,
        exercise_addition: float = 0.0,
        temp: float = None,
        humidity: float = None,
    ) -> int:
        base_ml = int(weight_kg * 33 * (1.0 + (exercise_addition or 0.0)))
        return DailyGoalCalculator.adjust_for_env(base_ml, temp, humidity)

    @staticmethod
    def adjust_for_env(base_goal: int, temp: float = None, humidity: float = None) -> int:
        """以 DB 個人化目標為基礎，依即時溫濕度修正當日建議飲水量（NIH/EFSA 係數）。"""
        if temp is not None and temp > 30:
            temp_modifier = 1.10
        elif temp is not None and temp > 25:
            temp_modifier = 1.05
        elif temp is not None and temp < 10:
            temp_modifier = 0.95
        else:
            temp_modifier = 1.0

        humidity_modifier = 1.05 if (humidity is not None and humidity < 30) else 1.0

        adjusted = int(base_goal * temp_modifier * humidity_modifier)
        return max(500, min(adjusted, 8000))

    @staticmethod
    def get_progress_summary(
        daily_goal: int,
        today_drink_ml: float,
        act_start_str: str = "08:00:00",
        act_end_str: str = "22:00:00",
    ) -> dict:
        """
        計算當前時段的飲水進度，回傳 daily_goal / target_now / message。
        """
        now = datetime.now(TZ)
        hour = now.hour
        minute = now.minute

        act_start = _parse_time(act_start_str)
        act_end = _parse_time(act_end_str)

        current_minutes = hour * 60 + minute
        start_minutes = act_start.hour * 60 + act_start.minute
        end_minutes = act_end.hour * 60 + act_end.minute
        total_active_minutes = end_minutes - start_minutes

        if total_active_minutes <= 0:
            total_active_minutes = 840  # fallback 14 小時

        if current_minutes < start_minutes:
            target_now = 0
        elif current_minutes >= end_minutes:
            target_now = daily_goal
        else:
            progress = (current_minutes - start_minutes) / total_active_minutes
            target_now = int(daily_goal * progress)

        pct_done = int(today_drink_ml / daily_goal * 100) if daily_goal > 0 else 0

        if today_drink_ml >= daily_goal:
            message = f"恭喜！您已達到今日建議飲水量（{daily_goal} ml，完成 {pct_done}%）！可以適度休息不用刻意喝水了。"
        elif today_drink_ml >= target_now:
            message = f"您的飲水進度很棒！今日已喝 {int(today_drink_ml)} ml（完成 {pct_done}%），目前超前進度，請繼續保持。"
        else:
            diff = target_now - int(today_drink_ml)
            cups = round(diff / 200, 1)
            message = f"今日已喝 {int(today_drink_ml)} ml（完成 {pct_done}%），建議現在再補充約 {diff} ml（約 {cups} 杯 200ml），讓進度跟上來。"

        return {
            "daily_goal": daily_goal,
            "target_now": target_now,
            "message": message,
        }


# ──────────────────────────────────────────────
# Part 2: 飲水間隔預測模型（Per-User ML）
# ──────────────────────────────────────────────
class IntervalPredictor:
    """
    預測使用者下一次喝水的間隔時間（分鐘），用於智慧推播。
    - 冷啟動：使用規則（goals.rmd_interval 或預設 90 分鐘）
    - 暖機後：使用 GradientBoostingRegressor，per-user 訓練
    """

    FEATURE_COLUMNS = [
        "hour", "day_type", "cumulative_intake",
        "remaining_target", "last_drink_volume", "time_since_last", "temp"
    ]

    def __init__(self):
        self._user_models: dict[int, dict] = {}

    def predict_next_interval(
        self,
        user_id: int,
        logs: list[dict],
        daily_goal: int,
        act_start_str: str = "08:00:00",
        act_end_str: str = "22:00:00",
        rmd_interval: int = 90,
        env_logs: list[dict] = None,
    ) -> dict:
        """
        主入口：預測下次飲水間隔並計算建議提醒時間。
        """
        now = datetime.now(TZ)

        # 嘗試訓練 / 使用快取模型
        X, y = self._build_training_data(logs, daily_goal, act_start_str, env_logs)

        if len(y) >= MIN_TRAINING_SAMPLES:
            model = self._get_or_train_model(user_id, X, y)
            current_features = self._extract_current_features(
                logs, daily_goal, env_logs
            )
            predicted_gap = max(10, int(model.predict(current_features)[0]))
            confidence = "model"
        else:
            # 冷啟動
            today_intake = self._calc_today_intake(logs)
            remaining = max(0, daily_goal - today_intake)
            act_end = _parse_time(act_end_str)
            hours_left = (datetime.combine(now.date(), act_end, tzinfo=TZ) - now).total_seconds() / 3600
            hours_left = max(0, hours_left)
            predicted_gap = self._cold_start_interval(remaining, hours_left, rmd_interval)
            confidence = "cold_start"

        # 調整提醒間隔
        today_intake = self._calc_today_intake(logs)
        remaining = max(0, daily_goal - today_intake)
        act_end = _parse_time(act_end_str)
        hours_left = (datetime.combine(now.date(), act_end, tzinfo=TZ) - now).total_seconds() / 3600
        hours_left = max(0, hours_left)

        adjusted_gap = adjust_reminder(predicted_gap, remaining, today_intake, hours_left)
        next_reminder_at = now + timedelta(minutes=adjusted_gap)

        return {
            "predicted_gap_minutes": predicted_gap,
            "adjusted_gap_minutes": adjusted_gap,
            "confidence": confidence,
            "next_reminder_at": next_reminder_at.isoformat(),
            "data_points": len(y),
        }

    # ── 訓練資料建構 ──

    def _build_training_data(
        self,
        logs: list[dict],
        daily_goal: int,
        act_start_str: str,
        env_logs: list[dict] = None,
    ) -> tuple:
        """
        將 drinking_logs 轉換成訓練用的 (X, y)。
        每對相鄰 log 產生一筆 sample。
        """
        if len(logs) < 2:
            return pd.DataFrame(columns=self.FEATURE_COLUMNS), pd.Series(dtype=float)

        # 先合併 3 分鐘內的連續飲水
        merged = self._merge_close_drinks(logs)
        if len(merged) < 2:
            return pd.DataFrame(columns=self.FEATURE_COLUMNS), pd.Series(dtype=float)

        act_start = _parse_time(act_start_str)
        rows = []

        for i in range(len(merged) - 1):
            curr = merged[i]
            next_log = merged[i + 1]

            curr_time = _parse_record_at(curr["record_at"])
            next_time = _parse_record_at(next_log["record_at"])

            # 跳過跨日
            if curr_time.date() != next_time.date():
                continue

            gap_minutes = (next_time - curr_time).total_seconds() / 60

            # 跳過不合理的間隔（太短=噪音，太長=離開）
            if gap_minutes > MAX_GAP_MINUTES or gap_minutes < MIN_GAP_MINUTES:
                continue

            # 計算當天累積量
            cumulative = self._calc_cumulative_at(merged, curr_time)

            # 距離上一次喝水的時間
            if i > 0:
                prev_time = _parse_record_at(merged[i - 1]["record_at"])
                if prev_time.date() == curr_time.date():
                    time_since_last = (curr_time - prev_time).total_seconds() / 60
                else:
                    time_since_last = (curr_time - datetime.combine(
                        curr_time.date(), act_start, tzinfo=TZ
                    )).total_seconds() / 60
            else:
                time_since_last = (curr_time - datetime.combine(
                    curr_time.date(), act_start, tzinfo=TZ
                )).total_seconds() / 60

            # 匹配溫度
            temp = self._match_temp(curr_time, env_logs)

            rows.append({
                "hour": curr_time.hour,
                "day_type": 1 if curr_time.weekday() >= 5 else 0,
                "cumulative_intake": cumulative,
                "remaining_target": max(0, daily_goal - cumulative),
                "last_drink_volume": curr["d_volume"],
                "time_since_last": max(0, time_since_last),
                "temp": temp if temp is not None else 25.0,
                "gap_minutes": gap_minutes,
            })

        if not rows:
            return pd.DataFrame(columns=self.FEATURE_COLUMNS), pd.Series(dtype=float)

        df = pd.DataFrame(rows)
        X = df[self.FEATURE_COLUMNS]
        y = df["gap_minutes"]
        return X, y

    # ── 模型管理 ──

    def _get_or_train_model(self, user_id: int, X, y):
        if self._needs_retrain(user_id):
            model = GradientBoostingRegressor(
                n_estimators=100,
                max_depth=3,
                min_samples_leaf=3,
                learning_rate=0.05,
                random_state=42,
            )
            model.fit(X, y)
            self._user_models[user_id] = {
                "model": model,
                "trained_at": datetime.now(TZ),
                "n_samples": len(y),
            }
            print(f"[IntervalPredictor] Trained model for user {user_id} with {len(y)} samples.")
        return self._user_models[user_id]["model"]

    def _needs_retrain(self, user_id: int) -> bool:
        if user_id not in self._user_models:
            return True
        cache = self._user_models[user_id]
        age_minutes = (datetime.now(TZ) - cache["trained_at"]).total_seconds() / 60
        return age_minutes > 120  # 每 2 小時重新訓練

    # ── 特徵提取（預測時用）──

    def _extract_current_features(
        self,
        logs: list[dict],
        daily_goal: int,
        env_logs: list[dict] = None,
    ) -> pd.DataFrame:
        """提取「現在這一刻」的特徵，用於預測下次間隔。"""
        now = datetime.now(TZ)
        merged = self._merge_close_drinks(logs)

        today_intake = self._calc_today_intake(logs)

        # 最後一次喝水
        last_volume = 200  # 預設值
        time_since_last = 90
        if merged:
            last_log = merged[-1]
            last_time = _parse_record_at(last_log["record_at"])
            last_volume = last_log["d_volume"]
            if last_time.date() == now.date():
                time_since_last = (now - last_time).total_seconds() / 60

        temp = self._match_temp(now, env_logs)

        features = pd.DataFrame([{
            "hour": now.hour,
            "day_type": 1 if now.weekday() >= 5 else 0,
            "cumulative_intake": today_intake,
            "remaining_target": max(0, daily_goal - today_intake),
            "last_drink_volume": last_volume,
            "time_since_last": max(0, time_since_last),
            "temp": temp if temp is not None else 25.0,
        }])
        return features

    # ── 冷啟動 ──

    @staticmethod
    def _cold_start_interval(
        remaining_target: int,
        hours_left: float,
        rmd_interval: int = 90,
    ) -> int:
        base = rmd_interval or 90
        if hours_left <= 0:
            return base

        drinks_needed = max(1, remaining_target / 200)
        minutes_left = hours_left * 60
        interval_by_need = minutes_left / drinks_needed

        return int(min(base, interval_by_need))

    # ── 工具函式 ──

    @staticmethod
    def _merge_close_drinks(logs: list[dict]) -> list[dict]:
        """合併 MERGE_WINDOW_MINUTES 內的連續飲水事件，過濾低於 MIN_VOLUME_ML 的噪音。"""
        if not logs:
            return []

        # 先過濾掉太小量的紀錄（感測器噪音）
        logs = [l for l in logs if l.get("d_volume", 0) >= MIN_VOLUME_ML]
        if not logs:
            return []

        merged = []
        current = {
            "d_volume": logs[0].get("d_volume", 0),
            "record_at": logs[0]["record_at"],
        }

        for i in range(1, len(logs)):
            curr_time = _parse_record_at(current["record_at"])
            next_time = _parse_record_at(logs[i]["record_at"])
            gap = (next_time - curr_time).total_seconds() / 60

            if gap <= MERGE_WINDOW_MINUTES:
                current["d_volume"] += logs[i].get("d_volume", 0)
            else:
                merged.append(current)
                current = {
                    "d_volume": logs[i].get("d_volume", 0),
                    "record_at": logs[i]["record_at"],
                }

        merged.append(current)
        return merged

    @staticmethod
    def _calc_today_intake(logs: list[dict]) -> int:
        """計算今天的累積飲水量。"""
        today = datetime.now(TZ).date()
        total = 0
        for log in logs:
            try:
                t = _parse_record_at(log["record_at"])
                if t.date() == today:
                    total += log.get("d_volume", 0)
            except Exception:
                pass
        return total

    @staticmethod
    def _calc_cumulative_at(merged_logs: list[dict], at_time: datetime) -> int:
        """計算 at_time 當天到該時間點的累積飲水量。"""
        total = 0
        target_date = at_time.date()
        for log in merged_logs:
            t = _parse_record_at(log["record_at"])
            if t.date() == target_date and t <= at_time:
                total += log.get("d_volume", 0)
        return total

    @staticmethod
    def _match_temp(at_time: datetime, env_logs: list[dict] = None) -> float:
        """找到最接近 at_time 的溫度紀錄。"""
        if not env_logs:
            return None
        best = None
        best_diff = float("inf")
        for env in env_logs:
            try:
                env_time = _parse_record_at(env["record_at"])
                diff = abs((env_time - at_time).total_seconds())
                if diff < best_diff:
                    best_diff = diff
                    best = env.get("temp")
            except Exception:
                pass
        return best


# ──────────────────────────────────────────────
# Part 3: 提醒時間調整
# ──────────────────────────────────────────────
def adjust_reminder(
    predicted_gap: int,
    remaining_target: int,
    cumulative_intake: int,
    hours_left: float,
) -> int:
    """
    根據剩餘目標量調整提醒間隔。
    若模型預測的間隔太長（來不及喝完當天目標），就縮短。
    """
    if hours_left <= 0 or remaining_target <= 0:
        return predicted_gap

    minutes_left = hours_left * 60
    avg_drink_ml = 200
    drinks_needed = max(1, remaining_target / avg_drink_ml)
    max_allowed_gap = minutes_left / drinks_needed

    adjusted = int(min(predicted_gap, max_allowed_gap))
    adjusted = max(15, adjusted)  # 下限 15 分鐘

    return adjusted


# ──────────────────────────────────────────────
# 共用工具
# ──────────────────────────────────────────────
def _parse_time(time_str: str) -> time:
    """將 '08:00:00' 格式的字串轉成 time 物件。"""
    parts = time_str.split(":")
    return time(int(parts[0]), int(parts[1]), int(parts[2]) if len(parts) > 2 else 0)


def _parse_record_at(record_at_str: str) -> datetime:
    """將 Supabase 的 timestamptz 字串轉成 Asia/Taipei datetime。"""
    dt = datetime.fromisoformat(record_at_str.replace('Z', '+00:00'))
    return dt.astimezone(TZ)
