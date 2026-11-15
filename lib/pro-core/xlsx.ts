// COPIE GÉNÉRÉE depuis functions/src/pro/core/xlsx.ts par scripts/sync-pro-core.mjs : ne pas modifier ici.
/**
 * functions/src/pro/core/xlsx.ts
 *
 * UN CLASSEUR EXCEL (.xlsx) ÉCRIT À LA MAIN, sans bibliothèque : l'export du carnet du pro
 * se fait sur l'appareil (téléphone ou navigateur), hors serveur. Un CSV casse sur un Excel
 * réglé en français (séparateur, arabe mal lu) ; un vrai classeur s'ouvre partout.
 *
 * Le strict nécessaire de SpreadsheetML : feuilles en texte en ligne (`inlineStr`, aucune
 * table de textes partagés), nombres en nombres (format « 12 000 »), ligne d'en-tête en gras
 * et figée, largeurs de colonnes, feuille de droite à gauche pour l'arabe. Le tout dans un
 * zip SANS compression (« stored »), CRC32 calculé ici. Module PUR (aucun accès disque).
 */

/** Une case : texte, nombre, ou vide (`null`, `undefined`, texte vide). */
export type CelluleXlsx = string | number | null | undefined;

export interface ColonneXlsx {
  titre: string;
  /** Largeur en caractères (Excel) ; 12 par défaut. */
  largeur?: number;
  /** Nombre affiché avec séparateur de milliers (montants en dinars). */
  montant?: boolean;
}

export interface FeuilleXlsx {
  nom: string;
  colonnes: readonly ColonneXlsx[];
  lignes: readonly (readonly CelluleXlsx[])[];
  /** Feuille de droite à gauche (classeur en arabe). */
  rtl?: boolean;
}

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
/** Plafond d'une case Excel. */
const TEXTE_MAX = 32767;

/* ------------------------------- Octets ------------------------------- */

/** Texte en UTF-8 (sans `TextEncoder`, absent de certains moteurs). Surrogate isolé : U+FFFD. */
export function octetsUtf8(texte: string): Uint8Array {
  // Au plus 3 octets par unité UTF-16 (une paire de substitution en donne 4 pour 2 unités).
  const out = new Uint8Array(texte.length * 3);
  let p = 0;
  for (let i = 0; i < texte.length; i += 1) {
    let c = texte.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const d = i + 1 < texte.length ? texte.charCodeAt(i + 1) : 0;
      if (d >= 0xdc00 && d <= 0xdfff) {
        c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
        i += 1;
      } else c = 0xfffd;
    } else if (c >= 0xdc00 && c <= 0xdfff) c = 0xfffd;
    if (c < 0x80) out[p++] = c;
    else if (c < 0x800) {
      out[p++] = 0xc0 | (c >> 6);
      out[p++] = 0x80 | (c & 63);
    } else if (c < 0x10000) {
      out[p++] = 0xe0 | (c >> 12);
      out[p++] = 0x80 | ((c >> 6) & 63);
      out[p++] = 0x80 | (c & 63);
    } else {
      out[p++] = 0xf0 | (c >> 18);
      out[p++] = 0x80 | ((c >> 12) & 63);
      out[p++] = 0x80 | ((c >> 6) & 63);
      out[p++] = 0x80 | (c & 63);
    }
  }
  return out.slice(0, p);
}

let TABLE_CRC: Uint32Array | null = null;

export function crc32(octets: Uint8Array): number {
  if (!TABLE_CRC) {
    TABLE_CRC = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      TABLE_CRC[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < octets.length; i += 1) crc = TABLE_CRC[(crc ^ octets[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Octets en base64 (écriture d'un fichier sur le téléphone). */
export function base64DesOctets(octets: Uint8Array): string {
  const morceaux: string[] = [];
  let out = '';
  for (let i = 0; i < octets.length; i += 3) {
    const a = octets[i];
    const b = i + 1 < octets.length ? octets[i + 1] : 0;
    const c = i + 2 < octets.length ? octets[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    out += i + 1 < octets.length ? B64[(n >> 6) & 63] : '=';
    out += i + 2 < octets.length ? B64[n & 63] : '=';
    // Morceaux courts : pas de longue chaîne refaite à chaque ajout (gros carnet sur téléphone).
    if (out.length >= 4096) {
      morceaux.push(out);
      out = '';
    }
  }
  morceaux.push(out);
  return morceaux.join('');
}

/* --------------------------------- Zip --------------------------------- */

interface FichierZip {
  nom: string;
  octets: Uint8Array;
}

/** Date et heure MS-DOS d'un instant (zip). */
function dateDos(ms: number): { date: number; heure: number } {
  const d = new Date(Number.isFinite(ms) ? ms : 0);
  const an = Math.min(2107, Math.max(1980, d.getUTCFullYear()));
  return {
    date: ((an - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate(),
    heure: (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | Math.floor(d.getUTCSeconds() / 2),
  };
}

/** Archive zip sans compression (méthode 0), noms en ASCII. */
export function zipSansCompression(fichiers: readonly FichierZip[], maintenant: number): Uint8Array {
  const { date, heure } = dateDos(maintenant);
  const morceaux: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let decalage = 0;
  for (const f of fichiers) {
    const nom = octetsUtf8(f.nom);
    const crc = crc32(f.octets);
    const local = new Uint8Array(30 + nom.length);
    const v = new DataView(local.buffer);
    v.setUint32(0, 0x04034b50, true);
    v.setUint16(4, 20, true);
    v.setUint16(6, 0, true);
    v.setUint16(8, 0, true);
    v.setUint16(10, heure, true);
    v.setUint16(12, date, true);
    v.setUint32(14, crc, true);
    v.setUint32(18, f.octets.length, true);
    v.setUint32(22, f.octets.length, true);
    v.setUint16(26, nom.length, true);
    v.setUint16(28, 0, true);
    local.set(nom, 30);
    const entree = new Uint8Array(46 + nom.length);
    const c = new DataView(entree.buffer);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0, true);
    c.setUint16(10, 0, true);
    c.setUint16(12, heure, true);
    c.setUint16(14, date, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, f.octets.length, true);
    c.setUint32(24, f.octets.length, true);
    c.setUint16(28, nom.length, true);
    c.setUint16(30, 0, true);
    c.setUint16(32, 0, true);
    c.setUint16(34, 0, true);
    c.setUint16(36, 0, true);
    c.setUint32(38, 0, true);
    c.setUint32(42, decalage, true);
    entree.set(nom, 46);
    morceaux.push(local, f.octets);
    central.push(entree);
    decalage += local.length + f.octets.length;
  }
  const tailleCentral = central.reduce((s, e) => s + e.length, 0);
  const fin = new Uint8Array(22);
  const e = new DataView(fin.buffer);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(4, 0, true);
  e.setUint16(6, 0, true);
  e.setUint16(8, fichiers.length, true);
  e.setUint16(10, fichiers.length, true);
  e.setUint32(12, tailleCentral, true);
  e.setUint32(16, decalage, true);
  e.setUint16(20, 0, true);
  const total = decalage + tailleCentral + fin.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const part of [...morceaux, ...central, fin]) {
    out.set(part, p);
    p += part.length;
  }
  return out;
}

/* --------------------------------- XML --------------------------------- */

/** Texte sûr pour XML : caractères interdits retirés, `& < > "` échappés. */
export function echapperXml(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 0 → « A », 26 → « AA ». */
export function lettresColonne(index: number): string {
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Nom de feuille accepté par Excel : 31 caractères, sans `[]:*?/\`, unique dans le classeur. */
function nomsDeFeuilles(noms: readonly string[]): string[] {
  const pris = new Set<string>();
  return noms.map((brut, i) => {
    let nom = brut.replace(/[[\]:*?/\\]/g, ' ').replace(/^'+|'+$/g, '').trim().slice(0, 31) || `Feuille ${i + 1}`;
    let n = 2;
    while (pris.has(nom.toLowerCase())) {
      const suffixe = ` (${n})`;
      nom = `${nom.slice(0, 31 - suffixe.length)}${suffixe}`;
      n += 1;
    }
    pris.add(nom.toLowerCase());
    return nom;
  });
}

const ENTETE_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_PKG = 'http://schemas.openxmlformats.org/package/2006/relationships';

/** Styles : 0 normal, 1 en-tête (gras, fond gris clair), 2 montant (« 12 000 »). */
const STYLES = `${ENTETE_XML}<styleSheet xmlns="${NS_MAIN}">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEDEDED"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function cellule(ref: string, valeur: CelluleXlsx, style: number): string {
  if (typeof valeur === 'number') {
    if (!Number.isFinite(valeur)) return '';
    return `<c r="${ref}"${style ? ` s="${style}"` : ''}><v>${valeur}</v></c>`;
  }
  const texte = typeof valeur === 'string' ? valeur.slice(0, TEXTE_MAX) : '';
  if (!texte) return '';
  return `<c r="${ref}" t="inlineStr"${style ? ` s="${style}"` : ''}><is><t xml:space="preserve">${echapperXml(texte)}</t></is></c>`;
}

function feuilleXml(f: FeuilleXlsx): string {
  const nbCol = Math.max(1, f.colonnes.length);
  const cols = f.colonnes
    .map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.max(4, Math.min(80, c.largeur ?? 12))}" customWidth="1"/>`)
    .join('');
  const lignes: string[] = [];
  lignes.push(`<row r="1">${f.colonnes.map((c, i) => cellule(`${lettresColonne(i)}1`, c.titre, 1)).join('')}</row>`);
  f.lignes.forEach((ligne, r) => {
    const n = r + 2;
    const cases = ligne
      .slice(0, nbCol)
      .map((v, i) => cellule(`${lettresColonne(i)}${n}`, v, typeof v === 'number' && f.colonnes[i]?.montant ? 2 : 0))
      .join('');
    lignes.push(`<row r="${n}">${cases}</row>`);
  });
  const fin = `${lettresColonne(nbCol - 1)}${f.lignes.length + 1}`;
  return `${ENTETE_XML}<worksheet xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">
<dimension ref="A1:${fin}"/>
<sheetViews><sheetView workbookViewId="0"${f.rtl ? ' rightToLeft="1"' : ''}><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
${cols ? `<cols>${cols}</cols>` : ''}
<sheetData>${lignes.join('')}</sheetData>
</worksheet>`;
}

/** Le classeur complet, prêt à écrire (`.xlsx`). */
export function classeurXlsx(feuilles: readonly FeuilleXlsx[], maintenant: number): Uint8Array {
  const liste = feuilles.length ? feuilles : [{ nom: 'Feuille 1', colonnes: [], lignes: [] }];
  const noms = nomsDeFeuilles(liste.map((f) => f.nom));
  const rtl = liste.some((f) => f.rtl);
  const types = `${ENTETE_XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${liste.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n')}
</Types>`;
  const rels = `${ENTETE_XML}<Relationships xmlns="${NS_PKG}"><Relationship Id="rId1" Type="${NS_REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const workbook = `${ENTETE_XML}<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL}">
<bookViews><workbookView${rtl ? ' rightToLeft="1"' : ''}/></bookViews>
<sheets>${noms.map((nom, i) => `<sheet name="${echapperXml(nom)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>
</workbook>`;
  const workbookRels = `${ENTETE_XML}<Relationships xmlns="${NS_PKG}">${liste
    .map((_, i) => `<Relationship Id="rId${i + 1}" Type="${NS_REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
    .join('')}<Relationship Id="rId${liste.length + 1}" Type="${NS_REL}/styles" Target="styles.xml"/></Relationships>`;
  const fichiers: FichierZip[] = [
    { nom: '[Content_Types].xml', octets: octetsUtf8(types) },
    { nom: '_rels/.rels', octets: octetsUtf8(rels) },
    { nom: 'xl/workbook.xml', octets: octetsUtf8(workbook) },
    { nom: 'xl/_rels/workbook.xml.rels', octets: octetsUtf8(workbookRels) },
    { nom: 'xl/styles.xml', octets: octetsUtf8(STYLES) },
    ...liste.map((f, i) => ({ nom: `xl/worksheets/sheet${i + 1}.xml`, octets: octetsUtf8(feuilleXml(f)) })),
  ];
  return zipSansCompression(fichiers, maintenant);
}
