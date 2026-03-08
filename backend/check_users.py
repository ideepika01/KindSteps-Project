from app.db.session import SessionLocal
from app.models.user import User

db = SessionLocal()
try:
    users = db.query(User).all()
    print("Listing all users:")
    for user in users:
        print(f"ID: {user.id}, Email: {user.email}, Role: {user.role}, Role type: {type(user.role)}")
finally:
    db.close()
