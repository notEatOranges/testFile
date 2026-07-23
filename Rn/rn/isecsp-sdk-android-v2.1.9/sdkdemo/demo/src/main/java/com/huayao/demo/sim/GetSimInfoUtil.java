package com.huayao.demo.sim;

import android.app.Activity;
import android.text.TextUtils;

import net.vpnsdk.vpn.VPNManager;

import java.util.ArrayList;
import java.util.List;

/**
 * 获取sim卡信息
 * devs/apps/containers
 */
public class GetSimInfoUtil {

    private static List<SimInfoDevBean> simInfoDevBeans = null;
    private static Activity context = null;

    public static List<SimInfoDevBean> getSimInfo(Activity context) {
        GetSimInfoUtil.context = context;
        if (simInfoDevBeans == null) {
            simInfoDevBeans = getSimDevInfo();
        }
        return simInfoDevBeans;
    }

    private static List<SimInfoDevBean> getSimDevInfo() {
        List<SimInfoDevBean> simInfoDevBeans = new ArrayList<>();
        try {
            String simEnumDev = VPNManager.getInstance().simEnumDev();
            String[] simEnumDevs = simEnumDev.split(",");
            for (int i = 0; i < simEnumDevs.length; i++) {
                SimInfoDevBean simInfoDevBean = new SimInfoDevBean();
                simInfoDevBean.setDevName(simEnumDevs[i]);
                simInfoDevBean.setAppNames(getSimAppInfos(simEnumDevs[i]));
                simInfoDevBeans.add(simInfoDevBean);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return simInfoDevBeans;
    }

    /**
     * 获取app
     */
    private static List<SimInfoDevBean.SimInfoAppBean> getSimAppInfos(String devName) {
        List<SimInfoDevBean.SimInfoAppBean> simInfoAppBeans = new ArrayList<>();
        try {
            String simEnumApp = VPNManager.getInstance().simEnumApp(devName);
            if (!TextUtils.isEmpty(simEnumApp)) {
                String[] simEnumApps = simEnumApp.split(",");
                for (int i = 0; i < simEnumApps.length; i++) {
                    SimInfoDevBean.SimInfoAppBean simInfoAppBean = new SimInfoDevBean.SimInfoAppBean();
                    simInfoAppBean.setAppName(simEnumApps[i]);
                    simInfoAppBean.setContainerNames(getSimContainerInfos(simEnumApps[i]));
                    simInfoAppBeans.add(simInfoAppBean);
                }
            } else {
                //无可用sim卡
                TSnackbar.showTSnack("No available application",context);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return simInfoAppBeans;
    }

    /**
     * 获取container
     */
    private static List<String> getSimContainerInfos(String appName) {
        List<String> simContainerInfos = new ArrayList<>();
        try {
            String simEnumContainer = VPNManager.getInstance().simEnumContainer(appName);
            String[] simEnumContainers = simEnumContainer.split(",");
            for (int i = 0; i < simEnumContainers.length; i++) {
                simContainerInfos.add(simEnumContainers[i]);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return simContainerInfos;
    }

    /**
     * 根据devName获取app列表
     */
    public static List<String> getAppsFromDevName(String devName) {
        List<String> apps = new ArrayList<>();
        for (int i = 0; i < simInfoDevBeans.size(); i++) {
            if (simInfoDevBeans.get(i).getDevName().equals(devName)) {
                for (int j = 0; j < simInfoDevBeans.get(i).getAppNames().size(); j++) {
                    apps.add(simInfoDevBeans.get(i).getAppNames().get(j).getAppName());
                }
            }
        }
        return apps;
    }

    /**
     * 根据appName获取Container列表
     */
    public static List<String> getContainersFromAppName(String devName, String appName) {
        List<String> containers = new ArrayList<>();
        for (int i = 0; i < simInfoDevBeans.size(); i++) {
            if (simInfoDevBeans.get(i).getDevName().equals(devName)) {
                for (int j = 0; j < simInfoDevBeans.get(i).getAppNames().size(); j++) {
                    //appName为空，默认返回第一个容器列表
                    if (simInfoDevBeans.get(i).getAppNames().get(j).getAppName().equals(appName) || TextUtils.isEmpty(appName)) {
                        return simInfoDevBeans.get(i).getAppNames().get(j).getContainerNames();
                    }
                }
            }
        }
        return containers;
    }
}
