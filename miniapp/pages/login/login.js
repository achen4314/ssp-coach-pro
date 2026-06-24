const app = getApp();

Page({
  data: {},
  handleLogin() {
    wx.login({
      success: res => {
        wx.request({
          url: app.globalData.apiBase + '/auth/wx-login',
          method: 'POST',
          data: { code: res.code },
          success: r => {
            if (r.statusCode === 200) {
              app.globalData.token = r.data.token;
              wx.setStorageSync('token', r.data.token);
              wx.setStorageSync('user', r.data.user);
              wx.switchTab({ url: '/pages/dashboard/dashboard' });
            }
          },
          fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
        });
      }
    });
  }
});
