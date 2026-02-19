import urllib.parse


def clean_url(url):
    if "pgbouncer=true" not in url:
        return url

    parsed = urllib.parse.urlparse(url)
    qs = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)

    if "pgbouncer" in qs:
        del qs["pgbouncer"]

    new_query = urllib.parse.urlencode(qs, doseq=True)

    # Reconstruct
    new_url = urllib.parse.urlunparse(
        (
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment,
        )
    )
    return new_url


urls = [
    "postgresql+pg8000://user:pass@host:5432/db?pgbouncer=true",
    "postgresql+pg8000://user:pass@host:5432/db?pgbouncer=true&other=1",
    "postgresql+pg8000://user:pass@host:5432/db?first=1&pgbouncer=true",
    "postgresql+pg8000://user:pass@host:5432/db?first=1&pgbouncer=true&last=2",
]

for u in urls:
    print(f"ORIG: {u}")
    print(f"NEW:  {clean_url(u)}")
    print("-" * 20)
