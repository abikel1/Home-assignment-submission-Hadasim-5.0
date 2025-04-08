const sql = require("mssql");

// קונפיגורציית החיבור למסד הנתונים
const config = {
  server: "grocerydb.mssql.somee.com",
  database: "grocerydb",
  user: "abikel1_SQLLogin_1",
  password: "h4s3j9i6c8",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

module.exports = config;