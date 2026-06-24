const app = getApp();
Page({
  data: { stats:{}, funnel:[], athletes:[] },
  onLoad() { this.fetch(); },
  fetch() {
    const h = { 'Authorization': 'Bearer ' + (wx.getStorageSync('token')||'') };
    Promise.all([
      wx.request({ url: app.globalData.apiBase + '/dashboard/stats', header: h }),
      wx.request({ url: app.globalData.apiBase + '/dashboard/funnel', header: h }),
      wx.request({ url: app.globalData.apiBase + '/athletes', header: h, data: {per_page:10} }),
    ]).then(([s,f,a]) => {
      this.setData({ stats:s.data, funnel:f.data, athletes:(a.data.items||a.data.data||[]) });
    });
  },
});
