# Data Processing Scripts

This repository contains several Python scripts designed to automate data processing tasks. Each script can be run independently from the command line to perform specific functions such as data enrichment, API lookups, and file updates.

---

## 🧩 Overview

Each script in this repository serves a distinct purpose. For example:

- **fetch_children.py** — Reads a CSV file and adds a column with child record IDs retrieved from a JSON API.
- *(Additional scripts will be described here as they are added.)*

Refer to the comments and usage instructions in each script for details on what they do and how to use them.

---

## 🛠️ Requirements

- Python **3.8+**
- Internet access (for scripts that perform API requests)

---

## 📦 Installation

1. Clone or download this repository:
   ```bash
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo
   ```

2. Ensure you have Python 3 installed:
   ```bash
   python3 --version
   ```

3. (Recommended) Create a virtual environment:

   ```bash
   python3 -m venv .venv
   ```

4. Activate the virtual environment:

   **On macOS/Linux:**
   ```bash
   source .venv/bin/activate
   ```

   **On Windows (PowerShell):**
   ```bash
   .\.venv\Scripts\Activate.ps1
   ```

5. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

## 🚀 Usage Example (fetch_children.py)

This script reads a CSV file and updates it with child record IDs fetched from a JSON API.

```bash
python fetch_children.py <csv_path> <root_url> <collection_col> <id_col> <file_col> <children_col>
```

### Example

```bash
python fetch_children.py "../data/Historic Maps - Special Collections Maps .csv" https://archives.mountainscholar.org/digital/api/collections/ collection "CONTENTdm number" "CONTENTdm file name" children
```

### Arguments

| Argument | Description |
|-----------|-------------|
| `<csv_path>` | Path to the CSV file |
| `<root_url>` | Root URL for the API requests |
| `<collection_col>` | Column containing the collection name |
| `<id_col>` | Column containing the record ID |
| `<file_col>` | Column containing the record’s file name |
| `<children_col>` | Column to create or update with child IDs |

---

## 🧪 Example JSON Response

```json
{
  "parent": {
    "children": [
      {"id": 101},
      {"id": 102}
    ]
  }
}
```

**Resulting CSV update:**

| collection | id | filename | children |
|-------------|----|-----------|-----------|
| sampledata | 1 | record.cpd | 101,102 |

---

## 🧾 Notes

- Scripts that modify files will overwrite them by default. To preserve originals, copy the files first or modify the script to write to a new output file.
- Network errors or invalid responses will skip updates for that row.
- Non-`.cpd` filenames are automatically ignored in `fetch_children.py`.

---

## 🧰 Automation Example

To run a script nightly using `cron` (Linux/macOS):

```bash
0 0 * * * /path/to/venv/bin/python /path/to/fetch_children.py /path/to/data.csv https://example.com api_collection id filename children
```

---

## 🧑‍💻 Author

**Your Name or Organization**  
*(Replace this section with your name and contact info.)*

---

## 📄 License

MIT License
