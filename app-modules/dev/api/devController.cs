using dev.Api;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace dev.Controllers
{
    [Route("api/[controller]")]
    public class devController : Controller
    {
        private devService _devService;

        public devController(devService ts)
        {
            _devService = ts;
        }
        [Route("GetTableData")]
        [HttpGet(nameof(GetTableData))]
        public async Task<IActionResult> GetTableData(string tableName)
        {
            if (string.IsNullOrWhiteSpace(tableName))
            {
                return this.NotFound();
            }
            string query = "SELECT * FROM [TS_GAP_v2].[dbo].["+ tableName +"];";

            var result = await _devService.RunQuery(query);
            var s = @"{""status"":true,""data"": {""items"":" + result + @"}}"; 
            return this.Ok(s);
        }

        [Route("GetTables")]
        [HttpGet(nameof(GetTables))]
        public async Task<IActionResult> GetTables(string dbName)
        {
            string query = "SELECT name, object_id as table_id FROM [TS_GAP_v2].sys.objects where type in ('U', 'V');";

            var result = await _devService.RunQuery(query);
            var s = @"{""status"":true,""data"": {""items"":" + result + @"}}";
            return this.Ok(s);
        }

        [Route("GetObjectsAndColumns")]
        [HttpGet(nameof(GetObjectsAndColumns))]
        public async Task<IActionResult> GetObjectsAndColumns(string dbName)
        {
            var result = await _devService.GetObjectsAndColumns();
            var s = @"{""status"":true,""data"": {" + result + @"}}";
            return this.Ok(s);
        }
    }
}