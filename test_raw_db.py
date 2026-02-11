import pg8000.dbapi

def test_raw_connect():
    try:
        users = ["postgres", "postgres.jnyzqjetppcjrmhrtubk"]
        hosts = ["db.jnyzqjetppcjrmhrtubk.supabase.co", "aws-0-ap-south-1.pooler.supabase.com"]
        
        for host in hosts:
            for user in users:
                try:
                    print(f"Trying {host} with user {user}...")
                    conn = pg8000.dbapi.connect(
                        user=user,
                        password="Deepika-2604",
                        host=host,
                        port=6543,
                        database="postgres",
                        timeout=5
                    )
                    print(f"SUCCESS on {host} with user {user}!")
                    conn.close()
                    return
                except Exception as e:
                    print(f"FAILED on {host} with user {user}: {e}")
    except Exception as e:
        print(f"Raw connection failed: {e}")

if __name__ == "__main__":
    test_raw_connect()
