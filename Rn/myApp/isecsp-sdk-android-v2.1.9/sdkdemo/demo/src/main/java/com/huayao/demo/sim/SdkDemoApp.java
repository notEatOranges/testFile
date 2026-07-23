package com.huayao.demo.sim;

import android.app.Application;

import com.huayao.demo.sim.SDKDemoConfig;
import com.simkey.sec.libciss.card.apdu.OMAAPDUSenderForSKF;
import com.simkey.sec.libciss.ciss.CISSSKFInit;

import net.vpnsdk.vpn.VPNManager;

public class SdkDemoApp extends Application {

    @Override
    public void onCreate() {
        super.onCreate();
        // 非 “中移互联网” 项目不需要此代码
        if(SDKDemoConfig.IS_SKF) {
            CISSSKFInit.init(this, false);
            OMAAPDUSenderForSKF.getInstance().setLogAble(true);
            VPNManager.getInstance().isUseSKF = true;
        }
    }
}
