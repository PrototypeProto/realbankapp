import bcrypt


def hash_password(plain: str) -> str:
    # bcrypt works on bytes; store the hash as utf-8 text.
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())
