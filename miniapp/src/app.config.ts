export default defineAppConfig({
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
  style: 'v2',
  sitemapLocation: 'sitemap.json',
});
