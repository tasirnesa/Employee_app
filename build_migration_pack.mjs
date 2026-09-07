import fs from "node:fs/promises";
import path from "node:path";
import { Workbook, SpreadsheetFile } from "file:///C:/Users/Tayesg/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const sourcePath = "C:/Users/Tayesg/Documents/coop_erp_latest.sql";
const outDir = "D:/EES/employee-evaluation/outputs/erp_migration_pack";
const csvDir = path.join(outDir, "csv_templates");
const sql = await fs.readFile(sourcePath, "utf8");

function parseSchema(text) {
  const tables = [];
  const re = /CREATE TABLE public\.([a-z0-9_]+) \(([\s\S]*?)\n\);/gi;
  for (const match of text.matchAll(re)) {
    const name = match[1];
    const columns = [];
    for (const raw of match[2].split("\n")) {
      const line = raw.trim().replace(/,$/, "");
      if (!line || /^(CONSTRAINT|PRIMARY KEY|UNIQUE|CHECK|FOREIGN KEY)/i.test(line)) continue;
      const m = line.match(/^([a-z][a-z0-9_]*)\s+(.+?)(?:\s+DEFAULT\s+.+)?(?:\s+(NOT NULL))?$/i);
      if (!m) continue;
      columns.push({ name: m[1], type: m[2].replace(/\s+NOT NULL$/i, "").trim(), required: /NOT NULL/i.test(line) });
    }
    tables.push({ name, columns });
  }
  const fk = new Map();
  const fkre = /ALTER TABLE ONLY public\.([a-z0-9_]+)\s+ADD CONSTRAINT [\s\S]*?FOREIGN KEY \(([a-z0-9_]+)\) REFERENCES public\.([a-z0-9_]+)\(([a-z0-9_]+)\)/gi;
  for (const m of text.matchAll(fkre)) {
    const key = `${m[1]}.${m[2]}`;
    fk.set(key, { table: m[3], column: m[4] });
  }
  return { tables, fk };
}

const { tables, fk } = parseSchema(sql);
console.log(`Parsed ${tables.length} tables`);
const tableMap = new Map(tables.map(t => [t.name, t]));
function moduleFor(name) {
  if (/^(account|ledger|journal|fiscal|currency|tax|bank|payment|vendor_ledger|customer_open|grir|general_ledger|ap_|ar_|budget|controlling|cost_center|profit_center)/.test(name)) return "Finance & Controlling";
  if (/^(supplier|po_|pr_|rfq_|vendor_quotation|contract|purchasing|approval)/.test(name)) return "Procurement";
  if (/^(material|stock|inventory|goods_|grn_|transfer|storage|movement|physical_inventory|quality|return_to_vendor|serial)/.test(name)) return "Inventory & Warehouse";
  if (/^(asset|depreciation|cwip)/.test(name)) return "Fixed Assets";
  if (/^(app_|role|user_|workflow|operation|process|resource|employee|attachment|audit)/.test(name)) return "Security & Workflow";
  return "Core & Reference";
}
function kindFor(name) {
  if (/^(country|currency|unit_of_measure|company|plant|storage_location|material_type|material_group|valuation_class|account_type|account_group|account_category_reference|tax_type|tax_code|tax_account_key|payment_term|movement_category|movement_reason|movement_type|reason_code|branch_grade|purchasing_group|depreciation_method|asset_class|asset_transaction_type|fiscal_year|fiscal_period|ledger|controlling_area|cost_center_account_group|approval_rule|approving_group|role|operation|process|subprocess|resource_node|document_number_range|tolerance_config)$/i.test(name)) return "Master / configuration";
  if (/(history|log|notification|queue|balance|ledger|open_item|schedule|snapshot|tracking|status)/i.test(name)) return "Derived / transactional history";
  return "Business object";
}
function phaseFor(name, kind) {
  if (kind === "Master / configuration") return "01 Master & configuration";
  if (/^(supplier|customer|material|account|employee|asset|bank_account)/.test(name)) return "02 Core master data";
  if (/^(stock_balance|account_balance|vendor_open_item|customer_open_item|grir_open_item|asset_book_account_history)/.test(name)) return "03 Opening balances";
  if (/^(pr_|rfq_|vendor_quotation|po_|contract|approval)/.test(name)) return "04 Procurement documents";
  if (/^(grn_|goods_|transfer|physical_inventory|stock_adjustment|return_to_vendor|quality|inventory_count|service_entry)/.test(name)) return "05 Inventory & service transactions";
  if (/^(ap_|ar_|payment_|journal_|depreciation|budget)/.test(name)) return "06 Finance transactions";
  if (/^(workflow|app_|user_|role|audit|attachment)/.test(name)) return "07 Security & workflow";
  return "08 Remaining business objects";
}
function safeSheet(name, used) {
  let s = name.substring(0, 31); let i = 1;
  while (used.has(s)) { const suffix = `_${i++}`; s = name.substring(0, 31 - suffix.length) + suffix; }
  used.add(s); return s;
}
function sampleFor(c, table) {
  if (c.name.endsWith("_id") || c.type.includes("uuid")) return c.name === `${table}_id` ? `MIG-${table.toUpperCase()}-001` : `REF-${c.name.toUpperCase()}-001`;
  if (/boolean/i.test(c.type)) return "true";
  if (/(integer|numeric|decimal|double|real|bigint|smallint)/i.test(c.type)) return "0";
  if (/date|timestamp/i.test(c.type)) return "2026-01-01";
  if (/json/i.test(c.type)) return "{}";
  if (/code/i.test(c.name)) return `${table.substring(0, 3).toUpperCase()}-001`;
  if (/name/i.test(c.name)) return `Sample ${c.name.replace(/_/g, " ")}`;
  if (/email/i.test(c.name)) return "migration@example.com";
  return c.required ? `Sample ${c.name.replace(/_/g, " ")}` : "";
}
function csvEscape(v) { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s; }

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(csvDir, { recursive: true });
for (const t of tables) {
  const header = t.columns.map(c => c.name);
  const sample = t.columns.map(c => sampleFor(c, t.name));
  await fs.writeFile(path.join(csvDir, `${t.name}.csv`), `${header.map(csvEscape).join(",")}\n${sample.map(csvEscape).join(",")}\n`, "utf8");
}

const flow = tables.map(t => ({ table: t.name, module: moduleFor(t.name), kind: kindFor(t.name), phase: phaseFor(t.name, kindFor(t.name)), required: t.columns.filter(c => c.required).map(c => c.name).join(", "), depends: t.columns.map(c => fk.get(`${t.name}.${c.name}`)).filter(Boolean).map(x => x.table).filter((v,i,a)=>a.indexOf(v)===i).join(", ") }));
const masters = flow.filter(x => x.kind === "Master / configuration" || /^(supplier|customer|material|account|employee|asset|bank_account)/.test(x.table));
const checklist = `# ERP Data Migration Checklist\n\nGenerated from coop_erp_latest.sql on 2026-07-17. This pack includes ${tables.length} physical-table CSV templates and matching Excel worksheets. Each template has a schema-aligned header plus one illustrative sample row.\n\n## Recommended sequence\n\n1. **Set up migration rules** — decide cutover date, source ownership, ID cross-reference strategy, duplicate policy, and reconciliation tolerances.\n2. **Load master/configuration data** — load the objects shown in the Master Data worksheet, following dependency order; validate codes before records that reference them.\n3. **Load core masters** — accounts, business partners, materials, employees, bank accounts, fixed assets, and organisational assignments.\n4. **Load opening balances** — stock, AP/AR, GR/IR, asset, and GL balances as at the agreed cutover date.\n5. **Load open documents** — procurement documents, service/inventory movements, and financial open documents, keeping source document references.\n6. **Load security/workflow selectively** — normally recreate users/roles/workflow configuration; do not bulk-load audit logs or generated histories unless specifically required.\n7. **Reconcile and sign off** — record counts, key totals, stock quantities/value, AP/AR aging, GL trial balance, and exception disposition by object.\n\n## CSV conventions\n\n- Headers reproduce the physical table columns in the SQL schema.\n- Required columns are marked Y in the Excel templates and Schema Catalog.\n- Values like REF-... in samples are placeholders for a valid referenced record; map actual legacy keys to target UUIDs/keys before import.\n- Exclude database-generated audit columns (created_at, updated_at, etc.) only if your import service supplies them; retain them when doing direct database loads.\n- Prefer business codes in your staging/cross-reference process, then resolve to system IDs during import.\n\n## Load controls\n\n- Validate required fields, data types, code uniqueness, and foreign-key references before load.\n- Load parent objects before child objects shown in Depends on.\n- Test in a non-production environment, reconcile, then repeat with final cutover data.\n- Retain the source extract, load log, rejected-row file, and reconciliation evidence for each run.\n\n## Scope note\n\nThe pack exposes every physical table so the technical migration team has full coverage. Tables labelled **Derived / transactional history** are usually not initial-load candidates; confirm their inclusion with the business process owner and technical lead.\n`;
await fs.writeFile(path.join(outDir, "Migration_Checklist.md"), checklist, "utf8");

const wb = Workbook.create(); const used = new Set();
console.log("Workbook created");
function addSheet(name) { return wb.worksheets.add(safeSheet(name, used)); }
function styleHeader(sheet, range) { sheet.getRange(range).format = { fill: "#0F766E", font: { bold: true, color: "#FFFFFF" }, wrapText: true, borders: { preset: "outside", style: "thin", color: "#0B5E56" } }; }
const overview = addSheet("Read Me"); overview.showGridLines = false;
overview.getRange("A1:F1").merge(); overview.getRange("A1").values = [["ERP Data Migration Pack"]]; overview.getRange("A1").format = { fill: "#0F766E", font: { bold: true, color: "#FFFFFF", size: 16 }, horizontalAlignment: "center" };
overview.getRange("A3:B10").values = [["Source schema","coop_erp_latest.sql"],["Physical tables",tables.length],["CSV templates",tables.length],["Workbook sheets",tables.length + 3],["Sample rows","One per object"],["Recommended entry point","Migration Flow worksheet"],["Import convention","Map legacy keys, validate, then resolve references"],["Scope","All physical tables; derived/history tables require business approval"]];
styleHeader(overview, "A3:B3"); overview.getRange("A3:B10").format.columnWidth = 32; overview.getRange("A3:B10").format.wrapText = true;
console.log("Read Me complete");
const flowSheet = addSheet("Migration Flow"); flowSheet.showGridLines = false;
const flowHeaders = ["Phase","Module","Object","Object type","Required fields","Depends on"];
flowSheet.getRangeByIndexes(0,0,1,flowHeaders.length).values = [flowHeaders];
flowSheet.getRangeByIndexes(1,0,flow.length,flowHeaders.length).values = flow.map(x => [x.phase,x.module,x.table,x.kind,x.required,x.depends]);
styleHeader(flowSheet, "A1:F1"); flowSheet.getRange(`A1:F${flow.length+1}`).format.wrapText = true; flowSheet.getRange(`A1:F${flow.length+1}`).format.columnWidth = 24; flowSheet.freezePanes.freezeRows(1);
console.log("Migration Flow complete");
const masterSheet = addSheet("Master Data"); masterSheet.showGridLines = false;
masterSheet.getRange("A1:F1").values = [flowHeaders]; masterSheet.getRangeByIndexes(1,0,masters.length,flowHeaders.length).values = masters.map(x => [x.phase,x.module,x.table,x.kind,x.required,x.depends]); styleHeader(masterSheet,"A1:F1"); masterSheet.getRange(`A1:F${masters.length+1}`).format.wrapText=true; masterSheet.getRange(`A1:F${masters.length+1}`).format.columnWidth = 24; masterSheet.freezePanes.freezeRows(1);
console.log("Master Data complete");
const catalog = addSheet("Schema Catalog"); catalog.showGridLines=false; const catHeaders=["Object","Module","Object type","Column","Data type","Required","References"];
const catRows=[]; for(const t of tables) for(const c of t.columns){ const ref=fk.get(`${t.name}.${c.name}`); catRows.push([t.name,moduleFor(t.name),kindFor(t.name),c.name,c.type,c.required?"Y":"",ref?`${ref.table}.${ref.column}`:""]); }
catalog.getRangeByIndexes(0,0,1,catHeaders.length).values=[catHeaders]; catalog.getRangeByIndexes(1,0,catRows.length,catHeaders.length).values=catRows; styleHeader(catalog,"A1:G1"); catalog.getRange(`A1:G${catRows.length+1}`).format.wrapText=true; catalog.getRange(`A1:G${catRows.length+1}`).format.columnWidth = 22; catalog.freezePanes.freezeRows(1);
console.log("Summary sheets complete");
for (const t of tables) {
  const sheet = addSheet(t.name); sheet.showGridLines = false;
  const cols = t.columns.map(c => c.name); const notes = t.columns.map(c => `${c.type}${c.required ? " | REQUIRED" : ""}${fk.get(`${t.name}.${c.name}`) ? ` | REF: ${fk.get(`${t.name}.${c.name}`).table}` : ""}`);
  sheet.getRangeByIndexes(0,0,1,cols.length).values=[cols]; sheet.getRangeByIndexes(1,0,1,cols.length).values=[notes]; sheet.getRangeByIndexes(2,0,1,cols.length).values=[t.columns.map(c=>sampleFor(c,t.name))];
  sheet.getRangeByIndexes(0,0,1,cols.length).format={fill:"#0F766E",font:{bold:true,color:"#FFFFFF"},wrapText:true,borders:{preset:"outside",style:"thin",color:"#0B5E56"}}; sheet.getRangeByIndexes(1,0,1,cols.length).format={fill:"#E6FFFB",font:{italic:true,color:"#115E59"},wrapText:true}; sheet.getRangeByIndexes(2,0,1,cols.length).format={fill:"#FFF7ED"}; sheet.getRangeByIndexes(0,0,3,cols.length).format.columnWidth = 18; sheet.getRangeByIndexes(0,0,3,cols.length).format.wrapText=true; sheet.freezePanes.freezeRows(2);
}
console.log("Object sheets complete");
const exportBlob = await SpreadsheetFile.exportXlsx(wb); await exportBlob.save(path.join(outDir,"ERP_Migration_Templates.xlsx"));
console.log("Workbook exported");
const inspect = await wb.inspect({kind:"table",range:"Migration Flow!A1:F12",include:"values",tableMaxRows:12,tableMaxCols:6});
console.log(inspect.ndjson);
const preview = await wb.render({sheetName:"Migration Flow",range:"A1:F24",scale:1,format:"png"}); await fs.writeFile(path.join(outDir,"migration_flow_preview.png"),new Uint8Array(await preview.arrayBuffer()));
console.log(JSON.stringify({tables:tables.length,csvDir,workbook:path.join(outDir,"ERP_Migration_Templates.xlsx")}));
