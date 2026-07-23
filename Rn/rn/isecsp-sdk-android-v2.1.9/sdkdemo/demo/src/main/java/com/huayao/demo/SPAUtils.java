package com.huayao.demo;

import android.text.TextUtils;

import net.vpnsdk.vpn.VPNManager;
import net.vpnsdk.vpn.struct.IsecspStartSPAPara;

public class SPAUtils {

    private static String spaUsername;
    private static String spaPassword;
    private static String spaPort;
    private static int vpnPort;
    private static String spaAddress;
    private static String vpnServer;
    private static String spaSharedPs;

    public static void setSPAPar(String spaUsername, String spaPassword, String spaPort, int vpnPort,
                                 String spaAddress, String vpnServer, String spaSharedPs){
        SPAUtils.spaUsername = spaUsername;
        SPAUtils.spaPassword = spaPassword;
        SPAUtils.spaPort = spaPort;
        SPAUtils.vpnPort = vpnPort;
        SPAUtils.spaAddress = spaAddress;
        SPAUtils.vpnServer = vpnServer;
        SPAUtils.spaSharedPs = spaSharedPs;
    }

    public static void startSPA(){
        if(TextUtils.isEmpty(spaUsername)){
            return;
        }
        VPNManager.getInstance().isecsp_start_spa(new IsecspStartSPAPara(spaUsername, spaPassword,
                VPNManager.getInstance().getDeviceId(), Integer.parseInt(spaPort), vpnPort, spaAddress, vpnServer, spaSharedPs, 1, 2));
    }
}
