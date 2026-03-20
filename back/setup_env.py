import os
import shutil

def setup():
    env_path = '.env'
    example_path = '.env.example'

    if os.path.exists(env_path):
        print("✅ .env 檔案已存在，跳過自動設定。")
        return

    if not os.path.exists(example_path):
        print("❌ 找不到 .env.example 檔案，請確認專案完整性。")
        return

    # 複製範本
    shutil.copy(example_path, env_path)
    print("🚀 已根據範本建立新的 .env 檔案！")

    # (進階) 提示輸入金鑰
    print("\n--- 請輸入開發所需的 API Key (若暫時沒有請直接按 Enter) ---")
    supabase_url = input("Supabase URL: ")
    supabase_key = input("Supabase Key: ")
    
    if supabase_url or supabase_key:
        with open(env_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        with open(env_path, 'w', encoding='utf-8') as f:
            for line in lines:
                if line.startswith('SUPABASE_URL='):
                    f.write(f'SUPABASE_URL={supabase_url}\n')
                elif line.startswith('SUPABASE_KEY='):
                    f.write(f'SUPABASE_KEY={supabase_key}\n')
                else:
                    f.write(line)
        print("✅ 金鑰已寫入 .env 檔案！")

if __name__ == "__main__":
    setup()