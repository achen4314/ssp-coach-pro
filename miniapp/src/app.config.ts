export default {
  pages: [
    'pages/login/index',
    'pages/dashboard/index',
    'pages/athletes/index',
    'pages/assessment/index',
  ],
  window: {
    navigationBarBackgroundColor: '#204040',
    navigationBarTitleText: 'SSP教练',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0a0f0f',
  },
  tabBar: {
    color: '#889492',
    selectedColor: '#a0c040',
    backgroundColor: '#111818',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/dashboard/index',
        text: '工作台',
        iconPath: 'assets/tab/dashboard.png',
        selectedIconPath: 'assets/tab/dashboard-active.png',
      },
      {
        pagePath: 'pages/athletes/index',
        text: '学员',
        iconPath: 'assets/tab/athletes.png',
        selectedIconPath: 'assets/tab/athletes-active.png',
      },
      {
        pagePath: 'pages/assessment/index',
        text: '评估',
        iconPath: 'assets/tab/assessment.png',
        selectedIconPath: 'assets/tab/assessment-active.png',
      },
    ],
  },
  style: 'v2',
  sitemapLocation: 'sitemap.json',
};
