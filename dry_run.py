import httpx
import sys
import os

def dry_run():
    # We'll try to reach the local server if it's running
    # but since we can't be sure, we'll just check if the backend code can be imported
    try:
        sys.path.append(os.path.join(os.getcwd(), 'backend'))
        from app.main import app
        from app.db.session import SessionLocal
        from app.models.report import Report
        from app.models.user import User
        
        print("Backend imports successful.")
        
        db = SessionLocal()
        try:
            # Check if we can query users
            user_count = db.query(User).count()
            print(f"Users in DB: {user_count}")
            
            # Check if we can query reports
            report_count = db.query(Report).count()
            print(f"Reports in DB: {report_count}")
            
            # Check columns in Report model
            r = Report()
            if hasattr(r, 'latitude'):
                print("Report model has 'latitude' attribute.")
            else:
                print("ERROR: Report model is missing 'latitude'!")
                
        finally:
            db.close()
            
    except Exception as e:
        print(f"Dry run failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    dry_run()
