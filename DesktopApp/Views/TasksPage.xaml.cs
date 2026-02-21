using System;
using System.Linq;
using DesktopApp.Models;
using DesktopApp.ViewModels;
using Microsoft.UI;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using Microsoft.UI.Xaml.Navigation;

namespace DesktopApp.Views
{
    public sealed partial class TasksPage : Page
    {
        private MainViewModel? _vm;

        public TasksPage()
        {
            this.InitializeComponent();
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            base.OnNavigatedTo(e);
            if (e.Parameter is MainViewModel vm)
            {
                _vm = vm;
                RefreshBoard();
            }
        }

        private void RefreshBoard()
        {
            if (_vm?.SelectedProject == null) return;
            var tasks = _vm.SelectedProject.Tasks;
            TodoList.ItemsSource = tasks.Where(t => t.Status == Models.TaskStatus.Todo).ToList();
            InProgressList.ItemsSource = tasks.Where(t => t.Status == Models.TaskStatus.InProgress).ToList();
            InReviewList.ItemsSource = tasks.Where(t => t.Status == Models.TaskStatus.InReview).ToList();
            DoneList.ItemsSource = tasks.Where(t => t.Status == Models.TaskStatus.Done).ToList();
            BlockedList.ItemsSource = tasks.Where(t => t.Status == Models.TaskStatus.Blocked).ToList();
        }

        private async void AddTask_Click(object sender, RoutedEventArgs e)
        {
            if (_vm?.SelectedProject == null) return;

            var titleBox = new TextBox { PlaceholderText = "Task title..." };
            var descBox = new TextBox { PlaceholderText = "Description (optional)", AcceptsReturn = true, Height = 80 };
            var statusPicker = new ComboBox
            {
                ItemsSource = Enum.GetValues(typeof(Models.TaskStatus)),
                SelectedIndex = 0,
                HorizontalAlignment = HorizontalAlignment.Stretch
            };
            var priorityPicker = new ComboBox
            {
                ItemsSource = Enum.GetValues(typeof(TaskPriority)),
                SelectedIndex = 1,
                HorizontalAlignment = HorizontalAlignment.Stretch
            };
            var ticketBox = new TextBox { PlaceholderText = "Ticket URL (e.g. Linear, Jira)..." };

            var panel = new StackPanel { Spacing = 10 };
            panel.Children.Add(new TextBlock { Text = "Title", Foreground = new SolidColorBrush(Colors.White) });
            panel.Children.Add(titleBox);
            panel.Children.Add(new TextBlock { Text = "Description", Foreground = new SolidColorBrush(Colors.White) });
            panel.Children.Add(descBox);
            panel.Children.Add(new TextBlock { Text = "Status", Foreground = new SolidColorBrush(Colors.White) });
            panel.Children.Add(statusPicker);
            panel.Children.Add(new TextBlock { Text = "Priority", Foreground = new SolidColorBrush(Colors.White) });
            panel.Children.Add(priorityPicker);
            panel.Children.Add(new TextBlock { Text = "Ticket URL", Foreground = new SolidColorBrush(Colors.White) });
            panel.Children.Add(ticketBox);

            var dialog = new ContentDialog
            {
                Title = "New Task",
                Content = panel,
                PrimaryButtonText = "Add",
                CloseButtonText = "Cancel",
                DefaultButton = ContentDialogButton.Primary,
                XamlRoot = this.XamlRoot
            };

            var result = await dialog.ShowAsync();
            if (result == ContentDialogResult.Primary && !string.IsNullOrWhiteSpace(titleBox.Text))
            {
                var task = new ProjectTask
                {
                    Title = titleBox.Text.Trim(),
                    Description = descBox.Text.Trim(),
                    Status = (Models.TaskStatus)statusPicker.SelectedItem!,
                    Priority = (TaskPriority)priorityPicker.SelectedItem!,
                    TicketUrl = ticketBox.Text.Trim()
                };
                _vm.SelectedProject.Tasks.Add(task);
                await _vm.SaveAsync();
                RefreshBoard();
            }
        }

        private async void Task_Click(object sender, ItemClickEventArgs e)
        {
            if (e.ClickedItem is not ProjectTask task || _vm?.SelectedProject == null) return;

            var statusPicker = new ComboBox
            {
                ItemsSource = Enum.GetValues(typeof(Models.TaskStatus)),
                SelectedItem = task.Status,
                HorizontalAlignment = HorizontalAlignment.Stretch
            };
            var priorityPicker = new ComboBox
            {
                ItemsSource = Enum.GetValues(typeof(TaskPriority)),
                SelectedItem = task.Priority,
                HorizontalAlignment = HorizontalAlignment.Stretch
            };

            var panel = new StackPanel { Spacing = 10 };
            panel.Children.Add(new TextBlock
            {
                Text = task.Title,
                Foreground = new SolidColorBrush(Colors.White),
                FontSize = 16,
                FontWeight = Microsoft.UI.Text.FontWeights.SemiBold
            });
            panel.Children.Add(new TextBlock
            {
                Text = task.Description,
                Foreground = new SolidColorBrush(Windows.UI.Color.FromArgb(255, 156, 163, 175)),
                TextWrapping = TextWrapping.Wrap
            });
            panel.Children.Add(new TextBlock { Text = "Status", Foreground = new SolidColorBrush(Colors.White) });
            panel.Children.Add(statusPicker);
            panel.Children.Add(new TextBlock { Text = "Priority", Foreground = new SolidColorBrush(Colors.White) });
            panel.Children.Add(priorityPicker);

            var dialog = new ContentDialog
            {
                Title = "Edit Task",
                Content = panel,
                PrimaryButtonText = "Save",
                SecondaryButtonText = "Delete",
                CloseButtonText = "Cancel",
                DefaultButton = ContentDialogButton.Primary,
                XamlRoot = this.XamlRoot
            };

            var result = await dialog.ShowAsync();
            if (result == ContentDialogResult.Primary)
            {
                task.Status = (Models.TaskStatus)statusPicker.SelectedItem!;
                task.Priority = (TaskPriority)priorityPicker.SelectedItem!;
                await _vm.SaveAsync();
                RefreshBoard();
            }
            else if (result == ContentDialogResult.Secondary)
            {
                _vm.SelectedProject.Tasks.Remove(task);
                await _vm.SaveAsync();
                RefreshBoard();
            }
        }
    }
}