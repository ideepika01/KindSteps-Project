import time
from passlib.context import CryptContext

def profile_hashing():
    # Test PBKDF2 (current)
    ctx_pbkdf2 = CryptContext(schemes=["pbkdf2_sha256"])
    password = "password123"
    
    print("Profiling PBKDF2 (Current)...")
    start = time.time()
    hashed = ctx_pbkdf2.hash(password)
    hash_time = time.time() - start
    print(f"Hash time: {hash_time:.4f}s")
    
    start = time.time()
    ctx_pbkdf2.verify(password, hashed)
    verify_time = time.time() - start
    print(f"Verify time: {verify_time:.4f}s")

    # Test Bcrypt (potential alternative)
    print("\nProfiling Bcrypt (Alternative)...")
    try:
        ctx_bcrypt = CryptContext(schemes=["bcrypt"])
        start = time.time()
        hashed = ctx_bcrypt.hash(password)
        hash_time = time.time() - start
        print(f"Hash time: {hash_time:.4f}s")
        
        start = time.time()
        ctx_bcrypt.verify(password, hashed)
        verify_time = time.time() - start
        print(f"Verify time: {verify_time:.4f}s")
    except Exception as e:
        print(f"Bcrypt error: {e}")

if __name__ == "__main__":
    profile_hashing()
