//index.js
//获取应用实例
const app = getApp()
const common = require('../../utils/util.js')
const requestUtil = require('../../utils/requestUtil.js')

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    sysbalance:'0',
    couponnum:0,
      points:0,
    phoneNumber:'',
    hasPhoneNumber: false,
    carcount:0,
    avatarDefaultUrl: '../../images/head_moren.png',
      avatarUrl:'',
    frompage:1,
      hasqd:0,//是否已签到 0 未签到 1已签到
      score:0,//积分获得分数
      showModal: false, //积分对话框
      txtqd:'',
      showInVoiceTip:!1, //发票提示信息框
      // version:''
  },
  //事件处理函数
  bindViewTap: function() {
    // wx.navigateTo({
    //   // url: '../logs/logs'
    //   url:'../login/login'
    // })
  },
  onLoad: function (options) {

    var that =this;

    if (options.frompage && options.frompage != "" && options.frompage != "undefined") {
      var frompage = options.frompage;
      that.setData({
        frompage: frompage,
      })
    }

      // wx.getSystemInfo({
      //     success: function(res) {
      //         that.setData({
      //             version:res.version
      //         })
      //     },
      // })
  },

  onShow:function(){
     var that = this;
     //刷新数据
     that.refreshUserData();
    },

    //获取绑定的formId
    submitInfo: function (e) {
        console.log("form_id:" + e.detail.formId);
        wx.setStorageSync("formId", e.detail.formId);
    },

    //下拉刷新
    onPullDownRefresh: function () {
      var that = this;
      console.log('下拉刷新', new Date());
      that.refreshUserData(true);
    },

    //刷新用户信息数据
    refreshUserData:function(isRefresh=false){
      var that = this;
      var utoken = wx.getStorageSync("utoken")
      var mobilenum = wx.getStorageSync("mobilenum")
      var carcount = that.data.carcount;
      var sysbalance = wx.getStorageSync("sysbalance")
      var couponnum = wx.getStorageSync("couponnum")
        var points = wx.getStorageSync("points")
        var obj={};
      //有utoken
      if (utoken) {//已绑定
        that.setData({
          sysbalance: sysbalance == '' ? 0 : sysbalance,
          couponnum: couponnum == '' ? 0 : couponnum,
            points:points==''?0:points,
          phoneNumber: mobilenum,
          hasPhoneNumber: true,
          carcount: carcount == '' ? 0 : carcount,
        })
          //获取用户信息
          that.getUserInfo(1,isRefresh);

      } else {
        //未绑定
        that.setData({
          userInfo: {},
          hasUserInfo: false,
          sysbalance: '0',
          couponnum: 0,
            points:0,
          phoneNumber: '',
          hasPhoneNumber: false,
          carcount: 0,
        })

        //登录用户
        requestUtil.login({
          success: function (res) {
            //已绑定过手机号的用户返回
            //  console.log(res);
            var utoken = wx.getStorageSync("utoken")
            var mobilenum = wx.getStorageSync("mobilenum")
            console.log("utoken:" + utoken);
            // that.setData({
            //   userInfo: app.globalData.userInfo,
            //   hasUserInfo: true,
            // })
              //获取用户信息
              that.getUserInfo(2,isRefresh);
          },
          complete: function (res) {
          },
          isShowLoading: true,
          fromtype:3,
        })
      }
    },

   //获取用户信息
    getUserInfo(type,isRefresh=false){
        var that = this;
        var carcount =that.data.carcount;
        var oldcarcount = wx.getStorageSync("carcount");
        var userinfo = wx.getStorageSync("userInfo");
        var obj={};
        //有网络,获取用户信息
        common.isNet(true, function (data) {
            //设置是从手机验证页面过去的
            obj.fromtype=2;
            //用户信息为空去获取一下或者下拉刷新去获取一下
            if(userinfo==""||common.isEmpty(userinfo)||isRefresh){
                requestUtil.getUserInfo(null,obj, function (data) {
                    //获取用户信息并且更新用户信息成功
                    app.globalData.userInfo = wx.getStorageSync("userInfo")
                    if (app.globalData.userInfo && app.globalData.userInfo != "" && typeof (app.globalData.userInfo) != "undefined") {
                        that.setData({
                            userInfo: app.globalData.userInfo,
                            hasUserInfo: true,
                        })
                    }
                });
            }
            //获取账户信息
            that.getAccountInfo(type,isRefresh)
            if(type==1){
                if (carcount!=oldcarcount) {
                    that.getVehicleList();
                }
            }else{
                that.getVehicleList();
            }
        })
    },

    //点击关闭发票提示框
    closeInVoiceDialog:function(){
        var that =this;
        that.setData({
            showInVoiceTip: !1,
        })
    },

    //去授权
    refreshAvatar:function(){
      var that=this;
        wx.setStorageSync("iscom",'');
        //获取用户信息
        that.getUserInfo(1);
    },

    //获取账户信息
    getAccountInfo(type,isRefresh=false){
      var that = this;
      requestUtil.httpPost('account/getAccountInfo',{
        'utoken': wx.getStorageSync("utoken"),
        'form_id': wx.getStorageSync("formId"),
      },(data)=>{
        // common.showSuccess("获取成功", 1000);
        wx.setStorageSync("sysbalance", common.fentoyuan(data.sysbalance))
        wx.setStorageSync("couponnum", data.couponnum)
        wx.setStorageSync("points",data.points)
        that.setData({
          phoneNumber: wx.getStorageSync("mobilenum"),
          sysbalance: common.fentoyuan(data.sysbalance),
          couponnum: data.couponnum,
            points:data.points,
          hasPhoneNumber: true,
            avatarUrl:data.headsimgpath,
        })
        let txtqd;
        let getScore=that.data.score;
        //判断是否已签到
        if(data.is_sign=='1'){//已签到
            if(getScore==0){
                txtqd='今日已签到';
            }else{
                txtqd='已签到+'+getScore+'积分';
            }
           that.setData({
               hasqd:1,
               txtqd:txtqd,
           });
        }else{
            that.setData({
                hasqd:0,
            });
        }

        }, this, { isShowLoading: type!=1&&!isRefresh, loadingText: '正在获取账户信息...',completeAfter:function (res) {
          if (!isRefresh) {
            common.hideToast();
          } else {
            setTimeout(function () {
              wx.stopPullDownRefresh();
            }, 1000)
          }
        } });

  },

  //获取已绑定的车辆
  getVehicleList() {
    var that = this;
    var utoken = wx.getStorageSync("utoken")
    var mobilenum = wx.getStorageSync("mobilenum")

    requestUtil.httpPost('account/getVehicleList', {
      'utoken': utoken,
        'form_id': wx.getStorageSync("formId"),
    }, (data) => {
      if (data.totalcount > 0) {
        wx.setStorageSync("carcount", data.totalcount);
        let carcount = data.totalcount;
          //存储绑定的车辆
          wx.setStorageSync("bindcars",data.list);
        that.setData({
          carcount: carcount
        })
      }else{
          wx.setStorageSync("carcount", 0);
          that.setData({
              carcount: 0
          })
      }
    }, this, { isShowLoading: false});
  },

    //点击签到
    btnqd:function(){
      var that=this;
      that.signIn();
    },

    //签到
    signIn(){
     var that = this;
        requestUtil.httpPost('account/signIn',{
            'utoken': wx.getStorageSync("utoken"),
        }, (data) => {
            //签到对话框
            var score =data.score;//积分
            var signinday = data.signinday; //连续签到天数
            // common.showSuccess("签到成功", 1000);
            var txtqd;
            if(score==0){
                txtqd='今日已签到';
            }else{
                txtqd='已签到+'+score+'积分';
            }
            that.setData({
                hasqd:1,
                showModal: true,
                score:score,
                txtqd:txtqd,
            })

    }, this, { isShowLoading: true, loadingText: '正在签到...'});

        },

    //确定
    btnOk:function(){
      var that=this;
      that.setData({
          showModal: false,
      });
      //刷新账户信息
        that.getAccountInfo(false);
    },

  //解绑手机
  unBindOpenid(){
    var that = this;
    var frompage = that.data.frompage;
    var mobilenum=wx.getStorageSync("mobilenum");

    requestUtil.httpPost('account/unBindOpenid',{
      'utoken': wx.getStorageSync("utoken"),
      'mobilenum': mobilenum,
    }, (data) => {
        common.showSuccess("解绑成功", 1000);
        wx.setStorageSync('mobilenum', '');
        wx.setStorageSync('utoken', '');
        wx.setStorageSync("userInfo", '');
        wx.setStorageSync("openid", '');
        wx.setStorageSync("wxsessionkey", '');
        wx.setStorageSync("sysbalance", 0);
        wx.setStorageSync("couponnum", 0);
        wx.setStorageSync("points",0);
        wx.setStorageSync("carcount",0);
        wx.setStorageSync("iscom",'');
        wx.setStorageSync("activityid",0);
        wx.setStorageSync("qftx",0);
        wx.setStorageSync("repaycountwarn",0);
        wx.setStorageSync("bindcars","");
        //退出清除缓存
        wx.clearStorage();
        that.setData({
          userInfo: {},
          sysbalance: '',
          phoneNumber: '',
          hasPhoneNumber: false,
          carcount: 0,
        })
        //来自与钱包页面
        if(frompage==0){
          wx.redirectTo({
            url: '../login/login?fromtype=3',
          })
        }else{
          wx.navigateTo({
            url: '../login/login?fromtype=1',
          })
        }  
      }, this, { isShowLoading: true, loadingText: '正在解绑手机号...'});

  },

 //退出事件
  exit:function(){
    var that = this;
    common.isNet(true, function (data) {
       that.unBindOpenid();
    });
  },

  //绑定手机号
  bindphone:function(){
    wx.navigateTo({
      url: '../login/login?fromtype=1',
    })
  },

    //跳转到发票页面
    goInVoice:function(){
        var that = this;
        var mobilenum=wx.getStorageSync("mobilenum");
        var utoken = wx.getStorageSync("utoken");
        if (utoken) {

            var title="发票";
            var jumpurl =app.globalData.invoiceUrl+'?token='+utoken+'&deviceId=WX#/';
            var isInVoiceClick=wx.getStorageSync(mobilenum+'_isInVoiceClick');
            if(isInVoiceClick&&isInVoiceClick=='1'){
                // wx.navigateTo({
                //     url: '../invoicewebview/invoicewebview',
                //     // url: '../carenterpark/carenterpark',
                //     // url: '../caroutpark/caroutpark',
                // })
                wx.navigateTo({ url: '/pages/invoicewebview/invoicewebview?title='+title+'&url='+jumpurl })
            }else{//首次点击弹出提示框
                that.setData({
                    showInVoiceTip: 1
                })
                wx.setStorageSync(mobilenum+'_isInVoiceClick', '1');
            }


        } else {
            wx.navigateTo({
                url: '../login/login?fromtype=2'
            })
        }
    },




    //去发票页面
    goToInVoice:function(){
      var that=this;
        var mobilenum=wx.getStorageSync("mobilenum");
        var utoken=wx.getStorageSync("utoken");
        var title="发票";
        var jumpurl =app.globalData.invoiceUrl+'?token='+utoken+'&deviceId=WX#/';
        that.setData({
            showInVoiceTip: !1
        })
        // wx.navigateTo({
        //     url: '../invoicewebview/invoicewebview',
        // })
        wx.navigateTo({ url: '/pages/invoicewebview/invoicewebview?title='+title+'&url='+jumpurl})
    },

    //跳转到使用帮助页面
    goHelpUrl:function(){
        var jumpurl =app.globalData.helpUrl;
        var title="使用帮助";
        wx.navigateTo({ url: '/pages/helpwebview/helpwebview?title='+title+'&url='+jumpurl})
    },

    /**
     * 跳转到问题反馈
     */
    gotoFeedbackList(){

        var utoken = wx.getStorageSync("utoken");
        if (utoken) {
            //去欠费补缴
            wx.navigateTo({
                url: '../feedback/feedback',
            })
        }else{
            wx.showModal({
                title: "提示",
                content: "您还没绑定手机号，是否现在去绑定?",
                confirmColor: '#4897FA',
                cancelColor: '#4897FA',
                showCancel: false,
                success: function (res) {
                    if (res.confirm) {
                        // console.log('用户点击确定')
                        wx.navigateTo({
                            url: '../login/login?fromtype=2'
                        })
                    } else if (res.cancel) {
                        // console.log('用户点击取消')
                    }
                }
            });
        }


        // var that=this;
        // wx.navigateTo({
        //     url: '../feedback/feedback',
        // })
        // wx.navigateTo({
        //     url: '../scancoupon/scancoupon',
        // })
        //提示再未开放
        // common.alertView("提示", "对不起，目前该功能未开放!", function () {
        //
        // });
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
      title: '我的',
      path: 'pages/my/my',
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
