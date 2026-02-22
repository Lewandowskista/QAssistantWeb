using Microsoft.UI.Xaml;
using System;

namespace DesktopApp
{
    public partial class App : Application
    {
        public static IntPtr MainWindowHandle { get; private set; }

        public App()
        {
            this.InitializeComponent();
        }

        protected override void OnLaunched(Microsoft.UI.Xaml.LaunchActivatedEventArgs args)
        {
            m_window = new MainWindow();
            m_window.Activate();
            MainWindowHandle = WinRT.Interop.WindowNative.GetWindowHandle(m_window);
        }

        private Window? m_window;
    }
}