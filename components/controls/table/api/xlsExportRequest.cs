using TS_GAP.Models;

namespace TS_GAP.Controllers
{
    public class xlsExportRequestDTO
    {
        public ExtraArgs extraArgs { get; set; }
        public dynamic export { get; set; }
    }
}