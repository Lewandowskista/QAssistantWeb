using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using DesktopApp.Models;
using DesktopApp.Services;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Threading.Tasks;

namespace DesktopApp.ViewModels
{
    public partial class MainViewModel : ObservableObject
    {
        private readonly StorageService _storage = new();

        [ObservableProperty]
        private ObservableCollection<Project> projects = new();

        [ObservableProperty]
        private Project? selectedProject;

        [ObservableProperty]
        private string activeTab = "Links";

        public async Task InitializeAsync()
        {
            var loaded = await _storage.LoadProjectsAsync();
            Projects = new ObservableCollection<Project>(loaded);

            if (Projects.Count == 0)
            {
                var demo = new Project { Name = "My QA Project" };
                demo.Links.Add(new EmbedLink { Title = "Notion Workspace", Url = "https://notion.so", Type = LinkType.Notion });
                demo.Links.Add(new EmbedLink { Title = "Figma Designs", Url = "https://figma.com", Type = LinkType.Figma });
                demo.Links.Add(new EmbedLink { Title = "Linear Board", Url = "https://linear.app", Type = LinkType.Linear });
                demo.Links.Add(new EmbedLink { Title = "GitHub Repo", Url = "https://github.com", Type = LinkType.GitHub });
                Projects.Add(demo);
                await SaveAsync();
            }

            SelectedProject = Projects[0];
        }

        [RelayCommand]
        private async Task AddProject()
        {
            var p = new Project { Name = $"Project {Projects.Count + 1}" };
            Projects.Add(p);
            SelectedProject = p;
            await SaveAsync();
        }

        [RelayCommand]
        private void SelectTab(string tab) => ActiveTab = tab;

        public async Task SaveAsync() =>
            await _storage.SaveProjectsAsync(new List<Project>(Projects));
    }
}