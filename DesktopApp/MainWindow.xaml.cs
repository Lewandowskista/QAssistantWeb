using System;
using System.Linq;
using DesktopApp.Models;
using DesktopApp.ViewModels;
using DesktopApp.Views;
using Microsoft.UI;
using Microsoft.UI.Windowing;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using WinRT.Interop;

namespace DesktopApp
{
    public sealed partial class MainWindow : Window
    {
        public MainViewModel ViewModel { get; } = new();
        private AppWindow? _appWindow;

        public MainWindow()
        {
            this.InitializeComponent();
            SetupWindow();
            LoadDataAsync();
        }

        private async void LoadDataAsync()
        {
            await ViewModel.InitializeAsync();
            RefreshProjectList();
        }

        // ── Window setup ────────────────────────────────────────────
        private void SetupWindow()
        {
            var hwnd = WindowNative.GetWindowHandle(this);
            var wndId = Win32Interop.GetWindowIdFromWindow(hwnd);
            _appWindow = AppWindow.GetFromWindowId(wndId);

            if (_appWindow == null) return;

            // Size and position
            _appWindow.Resize(new Windows.Graphics.SizeInt32(1200, 780));
            _appWindow.Move(new Windows.Graphics.PointInt32(100, 100));

            // Custom titlebar
            if (AppWindowTitleBar.IsCustomizationSupported())
            {
                var titleBar = _appWindow.TitleBar;
                titleBar.ExtendsContentIntoTitleBar = true;
                titleBar.ButtonBackgroundColor = Colors.Transparent;
                titleBar.ButtonInactiveBackgroundColor = Colors.Transparent;
                titleBar.ButtonForegroundColor = Colors.White;
            }

            // Set always on top and drag region after window is activated
            this.Activated += OnFirstActivated;
        }

        private void OnFirstActivated(object sender, WindowActivatedEventArgs e)
        {
            this.Activated -= OnFirstActivated; // run once only
            SetAlwaysOnTop(true);
            SetDragRegion();
        }

        // ── Events ──────────────────────────────────────────────────
        private void PinToggle_Toggled(object sender, RoutedEventArgs e)
        {
            SetAlwaysOnTop(PinToggle.IsOn);
        }

        private void ProjectList_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (ProjectList.SelectedItem is Project p)
            {
                ViewModel.SelectedProject = p;
                NavigateToCurrentTab();
            }
        }

        private void AddProject_Click(object sender, RoutedEventArgs e)
        {
            ViewModel.AddProjectCommand.Execute(null);
            RefreshProjectList();
        }

        private void Tab_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn)
            {
                ViewModel.ActiveTab = btn.Tag.ToString()!;
                UpdateTabStyles();
                NavigateToCurrentTab();
            }
        }

        // ── Navigation ───────────────────────────────────────────────
        private void NavigateToCurrentTab()
        {
            if (ViewModel.SelectedProject == null) return;

            switch (ViewModel.ActiveTab)
            {
                case "Links":
                    ContentFrame.Navigate(typeof(LinksPage), ViewModel);
                    break;
                case "Notes":
                    ContentFrame.Navigate(typeof(NotesPage), ViewModel);
                    break;
                case "Tasks":
                    ContentFrame.Navigate(typeof(TasksPage), ViewModel);
                    break;
                case "Settings":
                    ContentFrame.Navigate(typeof(SettingsPage));
                    break;
            }
        }

        private void UpdateTabStyles()
        {
            var tabs = new[] { TabLinks, TabNotes, TabTasks, TabSettings };
            foreach (var tab in tabs)
            {
                bool active = tab.Tag.ToString() == ViewModel.ActiveTab;
                tab.Background = active
                    ? new SolidColorBrush(Windows.UI.Color.FromArgb(255, 45, 45, 63))
                    : new SolidColorBrush(Colors.Transparent);
                tab.Foreground = active
                    ? new SolidColorBrush(Windows.UI.Color.FromArgb(255, 226, 232, 240))
                    : new SolidColorBrush(Windows.UI.Color.FromArgb(255, 107, 114, 128));
            }
        }

        private void RefreshProjectList()
        {
            ProjectList.ItemsSource = null;
            ProjectList.ItemsSource = ViewModel.Projects;
            if (ViewModel.SelectedProject != null)
                ProjectList.SelectedItem = ViewModel.SelectedProject;
            NavigateToCurrentTab();
        }

        private void SetAlwaysOnTop(bool onTop)
        {
            if (_appWindow?.Presenter is OverlappedPresenter presenter)
                presenter.IsAlwaysOnTop = onTop;
        }

        private void SetDragRegion()
        {
            if (_appWindow == null) return;
            if (!AppWindowTitleBar.IsCustomizationSupported()) return;

            _appWindow.TitleBar.SetDragRectangles(new[]
            {
        new Windows.Graphics.RectInt32(220, 0,
            (int)(_appWindow.Size.Width - 300), 48)
    });
        }

       
        }
    }