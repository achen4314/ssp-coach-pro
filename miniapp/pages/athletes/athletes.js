const app = getApp();
Page({
  data: { list:[] },
  onLoad(){ this.fetch(); },
  fetch(kw=''){
    const h = {'Authorization':'Bearer '+(wx.getStorageSync('token')||'')};
    wx.request({url:app.globalData.apiBase+'/athletes',header:h,data:{search:kw,per_page:50},success:r=>{
      this.setData({list:(r.data.items||r.data.data||[])});
    }});
  },
  onSearch(e){ this.fetch(e.detail.value); },
  goDetail(e){ wx.navigateTo({url:'/pages/detail/detail?id='+e.currentTarget.dataset.id}); }
});
