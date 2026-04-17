import os
import re

KNOWLEDGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "knowledge")

# 每個知識檔對應的關鍵字
KEYWORD_MAP = {
    "caffeine.md": ["咖啡", "拿鐵", "茶", "咖啡因", "提神", "能量飲料", "可樂", "caffeine", "利尿"],
    "hydration_health.md": ["健康", "認知", "記憶", "專注", "皮膚", "代謝", "消化", "便秘", "頭痛", "疲勞"],
    "exercise.md": ["運動", "跑步", "健身", "流汗", "電解質", "瑜伽", "重訓", "球類", "游泳", "HIIT"],
    "chronic_disease.md": ["腎臟", "心臟", "糖尿", "痛風", "慢性病", "血壓", "結石", "尿酸", "心衰"],
}


def find_relevant_knowledge(user_message: str, max_files: int = 2) -> str:
    """根據使用者訊息的關鍵字，載入相關的知識檔案內容。"""
    scores = {}

    for filename, keywords in KEYWORD_MAP.items():
        score = sum(1 for kw in keywords if kw in user_message)
        if score > 0:
            scores[filename] = score

    # 按分數排序，取前 max_files 個
    top_files = sorted(scores, key=scores.get, reverse=True)[:max_files]

    if not top_files:
        return ""

    chunks = []
    for filename in top_files:
        filepath = os.path.join(KNOWLEDGE_DIR, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                chunks.append(f.read())
        except FileNotFoundError:
            continue

    if not chunks:
        return ""

    return "\n\n【延伸知識庫】\n" + "\n---\n".join(chunks)
