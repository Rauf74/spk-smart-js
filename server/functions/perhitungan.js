import db from "../config/db.js";

const selectKriteriaBase = `
  SELECT
    id_kriteria,
    kode_kriteria,
    nama_kriteria,
    jenis,
    bobot
  FROM kriteria
  ORDER BY kode_kriteria ASC, id_kriteria ASC
`;

const selectKriteriaHeader = `
  SELECT
    id_kriteria,
    kode_kriteria,
    nama_kriteria
  FROM kriteria
  ORDER BY kode_kriteria ASC, id_kriteria ASC
`;

const selectAlternatifBase = `
  SELECT
    id_alternatif,
    kode_alternatif,
    nama_alternatif
  FROM alternatif
  ORDER BY kode_alternatif ASC, id_alternatif ASC
`;

const roundNumber = (value, precision = 4) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  const factor = 10 ** precision;
  return Math.round(num * factor) / factor;
};

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const ensureUserId = (id_user) => {
  const id = Number(id_user);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("ID user tidak valid.");
  }
  return id;
};

export async function getKriteriaForPerhitungan() {
  const [rows] = await db.query(selectKriteriaBase);
  return rows.map((row) => ({
    id_kriteria: row.id_kriteria,
    kode_kriteria: row.kode_kriteria,
    nama_kriteria: row.nama_kriteria,
    jenis: row.jenis,
  }));
}

export async function getKriteriaList() {
  const [rows] = await db.query(selectKriteriaHeader);
  return rows.map((row) => ({
    id_kriteria: row.id_kriteria,
    kode_kriteria: row.kode_kriteria,
    nama_kriteria: row.nama_kriteria,
  }));
}

export async function getCombinedKriteriaData() {
  const [rows] = await db.query(selectKriteriaBase);
  const totalBobot = rows.reduce(
    (total, row) => total + toNumber(row.bobot),
    0
  );

  return rows.map((row) => {
    const bobot = toNumber(row.bobot);
    const normalisasi =
      totalBobot > 0 ? roundNumber(bobot / totalBobot, 4) : 0;
    return {
      id_kriteria: row.id_kriteria,
      kode_kriteria: row.kode_kriteria,
      nama_kriteria: row.nama_kriteria,
      jenis: row.jenis,
      bobot,
      normalisasi,
    };
  });
}

export async function getKriteriaById(id_kriteria) {
  const id = Number(id_kriteria);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("ID kriteria tidak valid.");
  }

  const [rows] = await db.query(
    "SELECT * FROM kriteria WHERE id_kriteria = ?",
    [id]
  );
  const row = rows?.[0];

  if (!row) return null;

  return {
    id_kriteria: row.id_kriteria,
    kode_kriteria: row.kode_kriteria,
    nama_kriteria: row.nama_kriteria,
    jenis: row.jenis,
    bobot: toNumber(row.bobot),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

export async function getTotalKriteria() {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS total FROM kriteria"
  );
  return Number(rows?.[0]?.total || 0);
}

export async function getTotalAlternatif() {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS total FROM alternatif"
  );
  return Number(rows?.[0]?.total || 0);
}

export async function getTotalBobotKriteria() {
  const [rows] = await db.query(
    "SELECT COALESCE(SUM(bobot), 0) AS total_bobot FROM kriteria"
  );
  return toNumber(rows?.[0]?.total_bobot ?? 0);
}

const sumTotalNormalisasi = async () => {
  const data = await getCombinedKriteriaData();
  const total = data.reduce(
    (totalNormalisasi, row) => totalNormalisasi + toNumber(row.normalisasi),
    0
  );
  return roundNumber(total, 4);
};

export function getTotalNormalisasiBobot() {
  return sumTotalNormalisasi();
}

export async function getNilaiKriteriaAlternatif(id_user) {
  const userId = ensureUserId(id_user);

  const results = await Promise.all([
    db.query(selectAlternatifBase),
    db.query(selectKriteriaHeader),
    db.query(
      `
        SELECT
          id_alternatif,
          id_kriteria,
          jawaban
        FROM penilaian
        WHERE id_user = ?
      `,
      [userId]
    ),
  ]);

  const [alternatifs = [], kriterias = [], penilaianRows = []] = results.map(
    ([rows]) => rows || []
  );

  const nilaiMap = new Map();
  penilaianRows.forEach((row) => {
    const key = `${row.id_alternatif}-${row.id_kriteria}`;
    if (!nilaiMap.has(key)) nilaiMap.set(key, []);
    nilaiMap.get(key).push(toNumber(row.jawaban));
  });

  return alternatifs.map((alternatif) => {
    const result = {
      id_alternatif: alternatif.id_alternatif,
      kode_alternatif: alternatif.kode_alternatif,
      nama_alternatif: alternatif.nama_alternatif,
    };

    kriterias.forEach((kriteria) => {
      const values = nilaiMap.get(
        `${alternatif.id_alternatif}-${kriteria.id_kriteria}`
      );
      if (Array.isArray(values) && values.length > 0) {
        const average =
          values.reduce((sum, value) => sum + value, 0) / values.length;
        result[kriteria.kode_kriteria] = roundNumber(average, 2);
      } else {
        result[kriteria.kode_kriteria] = 0;
      }
    });

    return result;
  });
}

const fetchUtilitySource = async (id_user) => {
  const userId = ensureUserId(id_user);

  const query = `
    SELECT
      a.id_alternatif,
      a.kode_alternatif,
      a.nama_alternatif,
      k.id_kriteria,
      k.kode_kriteria,
      k.nama_kriteria,
      k.jenis,
      sub.nilai AS nilai_subkriteria
    FROM penilaian p
    INNER JOIN alternatif a ON p.id_alternatif = a.id_alternatif
    INNER JOIN kriteria k ON p.id_kriteria = k.id_kriteria
    INNER JOIN subkriteria sub ON p.id_subkriteria = sub.id_subkriteria
    WHERE p.id_user = ?
    ORDER BY
      a.kode_alternatif ASC,
      a.id_alternatif ASC,
      k.kode_kriteria ASC,
      k.id_kriteria ASC
  `;

  const [rows] = await db.query(query, [userId]);
  return rows.map((row) => ({
    ...row,
    nilai_subkriteria: toNumber(row.nilai_subkriteria),
  }));
};

const buildMinMaxMap = (rows) => {
  const minMax = new Map();

  rows.forEach((row) => {
    const current = minMax.get(row.id_kriteria);
    if (!current) {
      minMax.set(row.id_kriteria, {
        min: row.nilai_subkriteria,
        max: row.nilai_subkriteria,
      });
      return;
    }

    current.min = Math.min(current.min, row.nilai_subkriteria);
    current.max = Math.max(current.max, row.nilai_subkriteria);
  });

  return minMax;
};

const calculateUtilityValue = (nilai, jenis, min, max) => {
  if (max === min) return 1;

  const type = String(jenis || "").toLowerCase();
  if (type === "benefit") {
    return (nilai - min) / (max - min);
  }
  return (max - nilai) / (max - min);
};

export async function getNilaiUtilityAlternatif(id_user) {
  const source = await fetchUtilitySource(id_user);
  if (source.length === 0) return [];

  const minMaxMap = buildMinMaxMap(source);
  const grouped = new Map();

  source.forEach((row) => {
    const key = row.id_alternatif;
    if (!grouped.has(key)) {
      grouped.set(key, {
        id_alternatif: row.id_alternatif,
        kode_alternatif: row.kode_alternatif,
        nama_alternatif: row.nama_alternatif,
      });
    }

    const { min, max } = minMaxMap.get(row.id_kriteria) || {
      min: row.nilai_subkriteria,
      max: row.nilai_subkriteria,
    };

    const utility = calculateUtilityValue(
      row.nilai_subkriteria,
      row.jenis,
      min,
      max
    );

    grouped.get(key)[row.kode_kriteria] = roundNumber(utility, 4);
  });

  return Array.from(grouped.values());
}

export async function getRawUtilityData(id_user) {
  const source = await fetchUtilitySource(id_user);
  if (source.length === 0) return [];

  const minMaxMap = buildMinMaxMap(source);

  return source.map((row) => {
    const { min, max } = minMaxMap.get(row.id_kriteria) || {
      min: row.nilai_subkriteria,
      max: row.nilai_subkriteria,
    };

    const utility = calculateUtilityValue(
      row.nilai_subkriteria,
      row.jenis,
      min,
      max
    );

    return {
      id_alternatif: row.id_alternatif,
      kode_alternatif: row.kode_alternatif,
      nama_alternatif: row.nama_alternatif,
      id_kriteria: row.id_kriteria,
      kode_kriteria: row.kode_kriteria,
      nama_kriteria: row.nama_kriteria,
      jenis: row.jenis,
      nilai_subkriteria: row.nilai_subkriteria,
      min_kriteria: min,
      max_kriteria: max,
      nilai_utility: roundNumber(utility, 4),
    };
  });
}

export async function getNilaiAkhirAlternatif(id_user) {
  const utilityRows = await getNilaiUtilityAlternatif(id_user);
  if (utilityRows.length === 0) return [];

  const bobotData = await getCombinedKriteriaData();
  const kriteriaList = await getKriteriaList();

  const bobotMap = new Map(
    bobotData.map((row) => [row.kode_kriteria, toNumber(row.normalisasi)])
  );

  return utilityRows.map((row, index) => {
    let nilaiAkhirTotal = 0;
    const result = {
      no: index + 1,
      id_alternatif: row.id_alternatif,
      kode_alternatif: row.kode_alternatif,
      nama_alternatif: row.nama_alternatif,
    };

    kriteriaList.forEach((kriteria) => {
      const kode = kriteria.kode_kriteria;
      const utility = toNumber(row[kode]);
      const normalisasi = bobotMap.get(kode) || 0;
      const nilai = utility * normalisasi;

      result[kode] = roundNumber(nilai, 4);
      nilaiAkhirTotal += nilai;
    });

    result.nilai_akhir = roundNumber(nilaiAkhirTotal, 4);
    return result;
  });
}

export async function getSummaryTotals() {
  const [totalKriteria, totalAlternatif, totalBobot, totalNormalisasi] =
    await Promise.all([
      getTotalKriteria(),
      getTotalAlternatif(),
      getTotalBobotKriteria(),
      sumTotalNormalisasi(),
    ]);

  return {
    total_kriteria: totalKriteria,
    total_alternatif: totalAlternatif,
    total_bobot: totalBobot,
    total_normalisasi: totalNormalisasi,
  };
}
