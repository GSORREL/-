//index.js
var util = require('../../utils/util.js')
const requestUtil = require('../../utils/requestUtil.js')
//获取应用实例
const app = getApp()

Page({
  data: {
    value: {
      phone: '',
      code: ''
    },
    disabled: false,
    codeMsg: '获取验证码',
    error: true,
    focus1: true,
    focus2: false, 
    fromtype:2,  
  },

  onReady: function () {
    wx.setNavigationBarTitle({
      title: '验证手机'
    })
  },

  onLoad: function (options) {
    var that = this;
    if (options.fromtype && options.fromtype != "" && options.fromtype != "undefined") {
      var fromtype = options.fromtype;
      that.setData({
        fromtype: fromtype
      })
    }   
  },

  onShow:function(){
     var that=this;
    //  // 查看是否授权
    //  wx.getSetting({
    //    success: function (res) {
    //      if (res.authSetting['scope.userInfo']) {
    //        wx.getUserInfo({
    //          success: function (res) {
    //            console.log(res.userInfo)
    //           //  用户已经授权过
    //            wx.redirectTo({
    //              url: '/pages/index/index',
    //            })
    //          }
    //        })
    //      }
    //    }
    //  })
  },

  phoneCodeCheck: function (e) {
   
    this.setData({
      // 'errorMessage.phoneCodeError': '',
      'value.phone': e.detail.value
    })
  },
  CodeCheck: function (e) {
    this.setData({
      // 'errorMessage.phoneCodeError': '',
      'value.code': e.detail.value
    })
  },

  sendcode: function (e) {
    var that = this;
    if (that.data.value.phone == '') {
      // this.setData({
      //   'errorMessage.phoneCodeError': '请填写正确的手机号码！'
      // })
      wx.showModal({
        title: '提示',
        content: '请填写手机号码！',
        showCancel: false,
        confirmColor: '#209FD1',
        success: function (res) {
          if (res.confirm) {
            console.log('用户点击确定')
            that.setData({
              focus1: true,
              focus2: false,
            })
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }  
      })
    } else if (!util.isMobile(that.data.value.phone)){
        wx.showModal({
          title: '提示',
          content: '请填写正确的手机号码！',
          showCancel: false,
          confirmColor: '#209FD1',
          success: function (res) {
            if (res.confirm) {
              console.log('用户点击确定')
              that.setData({
                focus1: true,
                focus2: false,
              })
            } else if (res.cancel) {
              console.log('用户点击取消')
            }
          }  
        })
    }else {
      util.isNet(true, function (data) {
          var timer = 60;
          that.setData({
            'disabled': true,
            'error': false
          })
          var time = setInterval(function () {
            if (timer > 0) {
              that.setData({
                'codeMsg': --timer + '秒'
              })
            } else {
              that.setData({
                'codeMsg': '重新获取'
              })
              clearInterval(time)
              that.setData({
                'disabled': false
              })
            }
          }, 1000)

          //获取验证码
          requestUtil.httpPost('account/getPin', {
            'mobilenum': that.data.value.phone
          },(data)=>{
            //调用接口成功回调函数
            wx.showToast({
                  title: '发送成功',
                  duration: 700
                }) 
          },this,{isShowLoading:true});
      })
    }
  },

//     /*监听按钮状态*/
//     bindloginstate: function (e) {
//         this.setData({
//             userName: e.detail.value
//         })
//         if (this.data.userName == "") {
// //如果不为空，就返回true.
//             this.setData({
//                 userIdCardNameif: true
//             });
//         } else {
//             this.setData({
//                 userIdCardNameif: true
//             });
//         }
//
//     },

    //获取绑定的formId
    submitInfo: function (e) {
        console.log("form_id:" + e.detail.formId);
        wx.setStorageSync("formId", e.detail.formId);
    },

  formSubmit:function(e){
    var that=this;
    console.log(e.detail.formId);
    // wx.showToast({
    //   title: e.detail.formId,
    //   duration: 1000,
    // })
    wx.setStorageSync("formId", e.detail.formId);
    if (that.data.value.phone == '') {
      // this.setData({
      //   'errorMessage.phoneCodeError': '请填写正确的手机号码！'
      // })
      wx.showModal({
        title: '提示',
        content: '请填写手机号码！',
        showCancel: false,
        confirmColor: '#209FD1',
        success: function (res) {
          if (res.confirm) {
            console.log('用户点击确定')
            that.setData({
              focus1: true,
              focus2: false,
            })
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }  
      })
    } else if (!util.isMobile(that.data.value.phone)){
      wx.showModal({
        title: '提示',
        content: '请填写正确的手机号码！',
        showCancel: false,
        confirmColor: '#209FD1',
        success: function (res) {
          if (res.confirm) {
            console.log('用户点击确定')
            that.setData({
              focus1: true,
              focus2: false,
            })
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }  
      })
    } else if (that.data.value.code == '') {
      // this.setData({
      //   'errorMessage.codeError': '请填写验证码'
      // })
      wx.showModal({
        title: '提示',
        content: '请填写验证码！',
        showCancel: false,
        confirmColor: '#209FD1',
        success: function (res) {
          if (res.confirm) {
            console.log('用户点击确定')
            that.setData({
              focus1: false,
              focus2: true,
            })
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }  
      })
    } else {
       that.gotoIndex();
      }
    // }
    console.log('form发生了submit事件，携带数据为：', e.detail.value)
    
  },

    //点击下一步的事件
  gotoIndex:function(){
    var that =this;

    util.isNet(true, function (data) {

      var openid = wx.getStorageSync("openid");

      if (!util.isEmpty(openid)&&openid!="") {
         that.bindOpenid(2, openid);
      } else {
        //重新取登录
        requestUtil.login({
          success: function (res) {
            var openid = wx.getStorageSync("openid");
            that.bindOpenid(1, openid);
          },
          complete: function (res) {
          },
          isShowLoading: true,
          fromtype: 1,
        })
      }

    })

  },

    //微信授权登陆的事件
    quietLogin: function(e) {
        console.log(e.detail.errMsg)
        console.log(e.detail.iv)
        console.log(e.detail.encryptedData)
        var that= this;
        util.isNet(true, function (data) {
            if (e.detail.encryptedData && e.detail.iv) {
                console.log("授权成功");
                var openid = wx.getStorageSync("openid");
                var wxsessionkey = wx.getStorageSync("wxsessionkey");
                var n = {};
                n.encryptedData = e.detail.encryptedData; n.iv = e.detail.iv;
                //如果有openid，就可以去登录
                if (openid) {
                        // n.userType = o.data.userType,
                        // n.serviceId = t, n.source = o.data.source, n.unionId = o.data.unionId,
                        wx.checkSession({
                            success: function () {
                                console.log("有效");
                                //重新取绑定
                                that.bindOpenidByWxsq(1, openid,n,wxsessionkey);
                            },
                            fail: function () {
                                console.log("无效");
                                //重新执行登录
                                requestUtil.login({
                                    success: function (res) {
                                        var openid = wx.getStorageSync("openid");
                                        var wxsessionkey = wx.getStorageSync("wxsessionkey");
                                        setTimeout(function () {
                                            //重新去授权绑定
                                            that.bindOpenidByWxsq(1, openid,n,wxsessionkey);
                                        }, 1000)
                                    },
                                    complete: function (res) {
                                    },
                                    isShowLoading: true,
                                    fromtype: 1,
                                })
                            }
                        });
                } else {
                    // wx.showModal({
                    //     title: "提示",
                    //     content: "获取openId失败，小程序暂时无法使用",
                    //     showCancel: !1,
                    //     confirmText: "知道了"
                    // });

                    //重新取登录
                    requestUtil.login({
                        success: function (res) {
                            var openid = wx.getStorageSync("openid");
                            var wxsessionkey = wx.getStorageSync("wxsessionkey");
                            wx.checkSession({
                                success: function () {
                                    console.log("有效");
                                    setTimeout(function () {
                                        //重新去授权绑定
                                        that.bindOpenidByWxsq(1, openid,n,wxsessionkey);
                                    }, 1000)
                                },
                                fail: function () {
                                    console.log("无效");
                                    //重新执行登录
                                    requestUtil.login({
                                        success: function (res) {
                                            var openid = wx.getStorageSync("openid");
                                            var wxsessionkey = wx.getStorageSync("wxsessionkey");
                                            setTimeout(function () {
                                                //重新去授权绑定
                                                that.bindOpenidByWxsq(1, openid,n,wxsessionkey);
                                            }, 1000)
                                        },
                                        complete: function (res) {
                                        },
                                        isShowLoading: true,
                                        fromtype: 1,
                                    })
                                }
                            });
                        },
                        complete: function (res) {
                        },
                        isShowLoading: true,
                        fromtype: 1,
                    })
                }
            }
        })
    },

    //微信授权登录（通过openid绑定账号）
    bindOpenidByWxsq:function(islogin,openid,n,wxsessionkey){
        var that=this;
        var fromtype = that.data.fromtype;
        var obj={};
        var n=n;

        //绑定账号
        requestUtil.httpPost('account/bindOpenidByWxsq', {
            'openid': openid,
            'encryptedData':n.encryptedData,
            'iv':n.iv,
            'wxsessionkey':wxsessionkey,
            'form_id':wx.getStorageSync("formId"),
        }, (data) => {
            util.showSuccess("授权登录成功", 1000);
        //调用接口成功回调函数
        setTimeout(function () {
            // wx.switchTab({
            //   url: '../home/home'
            // })
            wx.setStorageSync('openid', data.openid);
            wx.setStorageSync('utoken', data.utoken);
            wx.setStorageSync('mobilenum', data.mobilenum);
            if (fromtype == 1) {//来自与我的
                wx.navigateBack({
                    delta: 2
                })
            } else if (fromtype == 2) { //来自与首页
                wx.navigateBack();
            }
            else {
                wx.redirectTo({
                    url: '../index/index',
                })
            }
        }, 1000)
    }, this, { isShowLoading: true, loadingText:'正在授权登录...' });
    },

  //绑定openid
  bindOpenid:function(islogin,openid){
    var that=this;
    var fromtype = that.data.fromtype;
    var obj={};
   
    //绑定账号
    requestUtil.httpPost('account/bindOpenid', {
      'openid': openid,
      'mobilenum': that.data.value.phone,
      'pin': that.data.value.code,
      'form_id':wx.getStorageSync("formId"),
    }, (data) => {
      util.showSuccess("绑定成功", 1000);
      //调用接口成功回调函数
        setTimeout(function () {
          // wx.switchTab({
          //   url: '../home/home'
          // })
          wx.setStorageSync('openid', data.openid);
          wx.setStorageSync('utoken', data.utoken);
          wx.setStorageSync('mobilenum', data.mobilenum);
          if (fromtype == 1) {//来自与我的
            wx.navigateBack({
              delta: 2
            })
          } else if (fromtype == 2) { //来自与首页
            wx.navigateBack();
          }
          else {
            wx.redirectTo({
              url: '../index/index',
            })
          }    
          // if(islogin==1){
          //   //设置是从手机验证页面过去的
          //   obj.fromtype=1;
          //   requestUtil.getUserInfo(null,obj, function (data) {
          //     // wx.navigateTo({
          //     //   url: '../index/index',
          //     // })  
          //     if (fromtype == 1) {//来自于我的
          //       wx.navigateBack({
          //         delta: 2
          //       })
          //     } else if (fromtype == 2) { //来自于首页
          //       wx.navigateBack();
          //     }else if(fromtype==3){//来自于钱包
          //       wx.navigateBack({
          //         delta: 2
          //       })
          //       wx.redirectTo({
          //         url: '../index/index',
          //       })
          //     }
          //     else{
          //       wx.redirectTo({
          //         url: '../index/index',
          //       })
          //     }    
          //  });
          // }else{
          //     // wx.navigateTo({
          //     //   url: '../index/index',
          //     // })
          //   if (fromtype == 1) {//来自与我的
          //     wx.navigateBack({
          //       delta: 2
          //     })
          //   } else if (fromtype == 2) { //来自与首页
          //      wx.navigateBack();
          //   }
          //   else {
          //     wx.redirectTo({
          //       url: '../index/index',
          //     })
          //   }    
          // }    
        }, 1000) 
      }, this, { isShowLoading: true, loadingText:'正在绑定...' });
  },

  //跳转到使用规则页面
  explainAct:function(){
    wx.navigateTo({ url: '/pages/webview/webview?title=使用规则与协议&url=' + app.globalData.protocolUrl })
  },

  /**
     * 用户点击右上角分享（index.js）
     */
  onShareAppMessage: function (ops) {
    if (ops.from === 'button') {
      // 来自页面内转发按钮
      console.log(ops.target)
    }
    return {
      title: '验证手机',
      path: 'pages/login/login',
      success: function (res) {
        // 转发成功
        console.log("转发成功:" + JSON.stringify(res));
      },
      fail: function (res) {
        // 转发失败
        console.log("转发失败:" + JSON.stringify(res));
      }
    }

  }

})
