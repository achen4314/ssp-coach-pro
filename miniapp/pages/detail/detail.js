const app = getApp();
Page({
  data: { a:{}, assessments:[] },
  onLoad(opts){
    const id = opts.id, h = {'Authorization':'Bearer '+(wx.getStorageSync('token')||'')};
    Promise.all([
      wx.request({url:app.globalData.apiBase+'/athletes/'+id,header:h}),
      wx.request({url:app.globalData.apiBase+'/athletes/'+id+'/assessments',header:h}),
    ]).then(([aRes,asRes])=>{
      this.setData({a:aRes.data, assessments:asRes.data||[]});
    });
  }
});
