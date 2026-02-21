using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using DesktopApp.Models;
using Newtonsoft.Json;

namespace DesktopApp.Services
{
    public class StorageService
    {
        private readonly string _dataPath;

        public StorageService()
        {
            var folder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "DesktopApp");
            Directory.CreateDirectory(folder);
            _dataPath = Path.Combine(folder, "projects.json");
        }

        public async Task<List<Project>> LoadProjectsAsync()
        {
            if (!File.Exists(_dataPath)) return new List<Project>();
            var json = await File.ReadAllTextAsync(_dataPath);
            return JsonConvert.DeserializeObject<List<Project>>(json) ?? new();
        }

        public async Task SaveProjectsAsync(List<Project> projects)
        {
            var json = JsonConvert.SerializeObject(projects, Formatting.Indented);
            await File.WriteAllTextAsync(_dataPath, json);
        }
    }
}