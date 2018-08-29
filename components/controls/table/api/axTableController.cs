using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using OfficeOpenXml;
using TS_GAP.Api.Services;
using TS_GAP.Models;
using Microsoft.AspNet.Http;
using OfficeOpenXml.Style;
using System.Drawing;
using HtmlTags;
using TS_GAP.Api.Configurations;
using Microsoft.Extensions.Options;

namespace TS_GAP.Controllers
{
    public class axTableController : BaseController
    {
        private readonly AppSettings _appSettings;
        private IHostingEnvironment henv;

        public axTableController(LoggedinUserService userInfoService, IHostingEnvironment _henv, IOptions<AppSettings> appSettings) : base(userInfoService)
        {
            henv = _henv;
            _appSettings = appSettings.Value;
        }

        [Route("xlsExport")]
        [HttpPost]
        public IActionResult xlsExport([FromBody] xlsExportRequestDTO exportParams)
        {
            if (ModelState.IsValid)
            {
                ExtraArgs extraArgs = exportParams.extraArgs;
                var user = GetValidCurrentUser(extraArgs.RoleId, extraArgs.OuId, extraArgs.EvaluationId); //TODO: check export rights
                FileInfo file = xlsExportCompute(user, exportParams.export);
                var mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                HttpContext.Response.ContentType = mimeType;
                HttpContext.Response.Headers.Add("Content-Disposition", "inline; filename=" + file.Name);
                HttpContext.Response.Headers.Add("Content-Transfer-Encoding", "binary");
                HttpContext.Response.Headers.Add("Cache-Control", "must-revalidate");

                FileContentResult result = new FileContentResult(System.IO.File.ReadAllBytes(file.FullName), mimeType)
                {
                    FileDownloadName = file.Name
                };
                return result;
            }
            else
            {
                return GetErrorDTO();
            }
        }

        private FileInfo xlsExportCompute(ApplicationUser user, dynamic export)
        {
            JObject exportJson = JObject.Parse(JsonConvert.SerializeObject(export));
            var columns = exportJson["columns"];
            var data = exportJson["data"];
            var reportName = (string)exportJson["reportName"];

            var file = createExportFile(user, "xlsx");
            using (ExcelPackage package = new ExcelPackage(file))
            {
                ExcelWorksheet worksheet = package.Workbook.Worksheets.Add(reportName);
                var columnIndex = 0;
                foreach (var column in columns)
                {
                    columnIndex++;
                    worksheet.Cells[1, columnIndex].Value = (string) column["header"];
                }
                using (var cells = worksheet.Cells[1, 1, 1, columnIndex])
                {
                    cells.Style.Font.Bold = true;
                    cells.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    cells.Style.Fill.BackgroundColor.SetColor(Color.LightGray);
                }
                var rowIndex = 1;
                foreach (var row in data)
                {
                    columnIndex = 0;
                    rowIndex++;
                    foreach (var column in columns)
                    {
                        columnIndex++;
                        var fieldName = (string) column["fieldName"];
                        worksheet.Cells[rowIndex, columnIndex].Value = (string) row[fieldName];
                    }
                }
                worksheet.Cells.AutoFitColumns();
                worksheet.View.FreezePanes(2, 1);
                package.Save();
            }
            return file;
        }

        private FileInfo createExportFile(ApplicationUser user, string extension)
        {
            string sFileName = @"Export_" + user.Id + "_" + DateTime.Now.ToString("dd_MM_yyyy") + "." + extension;
            var webRoot = henv.WebRootPath;
            FileInfo file = new FileInfo(Path.Combine(webRoot, sFileName));
            if (file.Exists)
            {
                file.Delete();
                file = new FileInfo(Path.Combine(webRoot, sFileName));
            }
            return file;
        }

        [Route("htmlExport")]
        [HttpPost]
        public IActionResult htmlExport([FromBody] xlsExportRequestDTO exportParams)
        {
            if (ModelState.IsValid)
            {
                ExtraArgs extraArgs = exportParams.extraArgs;
                var user = GetValidCurrentUser(extraArgs.RoleId, extraArgs.OuId, extraArgs.EvaluationId); //TODO: check export rights
                FileInfo file = htmlExportCompute(user, exportParams.export);
                HttpContext.Response.ContentType = "text/html";
                HttpContext.Response.Headers.Add("Content-Disposition", "inline; filename=" + file.Name);
                HttpContext.Response.Headers.Add("Content-Transfer-Encoding", "binary");
                HttpContext.Response.Headers.Add("Cache-Control", "must-revalidate");

                FileContentResult result = new FileContentResult(System.IO.File.ReadAllBytes(file.FullName), HttpContext.Response.ContentType)
                {
                    FileDownloadName = file.Name
                };
                return result;
            }
            else
            {
                return GetErrorDTO();
            }
        }

        private FileInfo htmlExportCompute(ApplicationUser user, dynamic export)
        {
            JObject exportJson = JObject.Parse(JsonConvert.SerializeObject(export));
            var columns = exportJson["columns"];
            var data = exportJson["data"];
            var reportName = (string) exportJson["reportName"];
            var file = createExportFile(user, "html");
            var fileStream = new FileStream(file.FullName, FileMode.Create) ;
            StreamWriter sw = new StreamWriter(fileStream) ;
            using (HtmlTextWriter writer = new HtmlTextWriter(sw))
            {
                var html = new HtmlTag("html");
                var title = new HtmlTag("title").Text(reportName);
                var head = new HtmlTag("head").Style("font-family", "Arial, sans serif");
                head.Children.Add(title);
                html.Children.Add(head);
                var table = new HtmlTag("table").Attr("border",1).Style("border-collapse","collapse");
                var thead = new HtmlTag("thead");
                var theadTr = new HtmlTag("tr");
                foreach (var column in columns)
                {
                    var th = new HtmlTag("th").Text((string)column["header"]);
                    theadTr.Children.Add(th);
                }
                thead.Children.Add(theadTr);
                table.Children.Add(thead);
                var tbody = new HtmlTag("tbody");
                foreach (var rowData in data)
                {
                    var tr = new HtmlTag("tr");
                    foreach (var column in columns)
                    {
                        var td=new HtmlTag("td").Style("border-left", "1px solid lightgray").Style("padding", "1px 2px 1px 6px");
                        td.Text((string) rowData[(string) column["fieldName"]]);
                        tr.Children.Add(td);
                    }
                    tbody.Children.Add(tr);
                }
                table.Children.Add(tbody);
                html.Children.Add(table);
                writer.Write(html);
            }
            sw.Dispose();
            return file;
        }
    }
}