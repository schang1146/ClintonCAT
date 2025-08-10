import json
import os
import requests

WIKI_USER = "Schang1146"
WIKI_BOTNAME = "extension_test"
WIKI_USERNAME = f"{WIKI_USER}@{WIKI_BOTNAME}"
WIKI_PASSWORD = os.environ["WIKI_BOT_PASSWORD"]

API_URL = "https://consumerrights.wiki/api.php"

CARGO_TABLE_FIELDS = {
    "Company": [
        "_pageName=PageName",
        "_pageID=PageID",
        "Description",
        "Industry",
        "ParentCompany",
        "Type",
        "Website",
    ],
    "Incident": [
        "_pageName=PageName",
        "_pageID=PageID",
        "Company",
        "StartDate",
        "EndDate",
        "Status",
        "ProductLine",
        "Product",
        "Type",
        "Description",
    ],
    "Product": [
        "_pageName=PageName",
        "_pageID=PageID",
        "Category",
        "Company",
        "Description",
        "ProductLine",
        "Website",
    ],
    "ProductLine": [
        "_pageName=PageName",
        "_pageID=PageID",
        "Category",
        "Company",
        "Description",
        "Website",
    ],
}
PAGE_SIZE = 500  # max limit per MediaWiki request


def authenticate(
    username: str,
    password: str,
    login_token: str,
):
    data = {
        "action": "login",
        "format": "json",
        "lgname": username,
        "lgpassword": password,
        "lgtoken": login_token,
    }
    session.post(url=API_URL, data=data)


def export_to_json(data: any, file_path):
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(obj=data, fp=f, indent=2, ensure_ascii=False)


def fetch_login_token() -> str:
    params = {"action": "query", "format": "json", "meta": "tokens", "type": "login"}
    res = session.get(url=API_URL, params=params)
    return res.json()["query"]["tokens"]["logintoken"]


def query_all_pages(table: str):
    fields = CARGO_TABLE_FIELDS[table]
    offset = 0
    output = []

    while True:
        params = {
            "action": "cargoquery",
            "format": "json",
            "tables": table,
            "fields": ",".join(fields),
            "offset": offset,
        }
        res = session.get(url=API_URL, params=params)
        res.raise_for_status()

        data = res.json().get("cargoquery", [])
        if data == []:
            break
        output.extend([entry["title"] for entry in data])
        offset += PAGE_SIZE

    return output


if __name__ == "__main__":
    session = requests.session()

    # Authenticate
    authenticate(
        username=WIKI_USERNAME,
        password=WIKI_PASSWORD,
        login_token=fetch_login_token(),
    )

    output = {}
    for table_name in CARGO_TABLE_FIELDS:
        output[table_name] = query_all_pages(table_name)

    filename = os.path.join(os.getcwd(), "export.json")
    export_to_json(output, filename)
