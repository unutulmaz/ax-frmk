using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System;
using System.Data.Common;
using System.Text;
using System.Threading.Tasks;
using TS_GAP.Api.Configurations;
using TS_GAP.Models;

namespace dev.Api
{
    public class devService
    {
        private readonly AppSettings _appSettings;
        protected TsgapContext _context;
        private string dataBase = "";

        public devService(TsgapContext context, IOptions<AppSettings> appSettings)
        {
            this._context = context;
            _appSettings = appSettings.Value;
            dataBase = _appSettings.DbName;
        }

        public async Task<object> RunQuery(string query)
        {
            //            List<object> rows = new List<object>();
            StringBuilder sb = new StringBuilder();
            var conn = _context.Database.GetDbConnection();
            try
            {
                await conn.OpenAsync();
                using (var command = conn.CreateCommand())
                {
                    command.CommandText = query;
                    DbDataReader reader = await command.ExecuteReaderAsync();

                    sb.Append("[");
                    if (reader.HasRows)
                    {
                        var colsDb = reader.GetColumnSchema();
                        DbColumn[] colNames = new DbColumn[reader.FieldCount];
                        colsDb.CopyTo(colNames, 0);

                        bool first = true;
                        while (await reader.ReadAsync())
                        {
                            if (!first) sb.Append(",");
                            sb.Append("{");

                            Object[] row = new Object[reader.FieldCount];
                            reader.GetValues(row);

                            int i = 0;
                            foreach (var col in row)
                            {
                                var columnDB = colNames[i];
                                string colName = columnDB.ColumnName;
                                sb.Append("\"" + colName + "\": " + "\"" + col.ToString() + "\"");
                                if (i < reader.FieldCount - 1) sb.Append(",");
                                i++;
                            }
                            sb.Append("}");
                            first = false;
                        }
                    }
                    sb.Append("]");
                    reader.Dispose();
                }
            }
            finally
            {
                conn.Close();
            }
            string s = sb.ToString();
            return s;
        }

        public async Task<object> GetObjectsAndColumns()
        {
            string query = @"SELECT c.column_id, c.name as column_name, c.object_id as object_id, t.name as object_name, t.type, t.type_desc FROM ["+dataBase+"].sys.Columns c INNER JOIN ["+dataBase+"].sys.objects t ON t.object_id = c.object_id WHERE t.type in ('U', 'V') ORDER BY t.name, c.column_id;";
            //string[] group_by = new string[2] {"table_id", "table_name"};
            StringBuilder sb = new StringBuilder();
            var conn = _context.Database.GetDbConnection();
            try
            {
                await conn.OpenAsync();
                using (var command = conn.CreateCommand())
                {
                    command.CommandText = query;
                    DbDataReader reader = await command.ExecuteReaderAsync();

                    sb.Append("\"items\": [");
                    string table_id = "";
                    if (reader.HasRows)
                    {
                        /*var colsDb = reader.GetColumnSchema();
                        DbColumn[] colNames = new DbColumn[reader.FieldCount];
                        colsDb.CopyTo(colNames, 0);*/

                        bool first = true;
                        while (await reader.ReadAsync())
                        {
                            string new_table_id = reader.GetString(3);
                            if (!table_id.Equals(new_table_id))
                            {
                                first = true;
                                if (!string.IsNullOrWhiteSpace(table_id)) sb.Append("]},");

                                sb.Append("{ \"name\": \"" + reader.GetString(3) +
                                          "\", \"id\": \"" + reader.GetInt32(2).ToString() +
                                          "\", \"type\": \"" + reader.GetString(4).Trim() +
                                          "\", \"type_desc\": \"" + reader.GetString(5).Trim() +
                                          "\", \"columns\":[");
                                table_id = new_table_id;
                            }
                            else
                            {
                                if (!first) sb.Append(",");
                            }
                            sb.Append("{\"column_name\": \"" + reader.GetString(1) + "\", \"column_id\": \"" + reader.GetInt32(0).ToString() + "\"}");
                            first = false;
                        }
                    }
                    sb.Append("]}]");
                    reader.Dispose();
                }
            }
            finally
            {
                conn.Close();
            }
            string s = sb.ToString();
            return s;
        }

    }
}
