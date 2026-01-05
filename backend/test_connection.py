import socket
import sys

host = "db.jnyzqjetppcjrmhrtubk.supabase.co"
port = 5432

print(f"Testing connectivity to {host}:{port}...")

try:
    sock = socket.create_connection((host, port), timeout=10)
    print("SUCCESS: Connection established!")
    sock.close()
except Exception as e:
    print(f"FAILURE: Could not connect. Error: {e}")
