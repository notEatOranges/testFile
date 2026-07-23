package com.huayao.demo.sim;

import java.util.List;

public class SimInfoDevBean {

    private String devName;
    private List<SimInfoAppBean> appNames;

    public static class SimInfoAppBean{
        private String appName;
        private List<String> containerNames;

        public String getAppName() {
            return appName;
        }

        public void setAppName(String appName) {
            this.appName = appName;
        }

        public List<String> getContainerNames() {
            return containerNames;
        }

        public void setContainerNames(List<String> containerNames) {
            this.containerNames = containerNames;
        }
    }

    public String getDevName() {
        return devName;
    }

    public void setDevName(String devName) {
        this.devName = devName;
    }

    public List<SimInfoAppBean> getAppNames() {
        return appNames;
    }

    public void setAppNames(List<SimInfoAppBean> appNames) {
        this.appNames = appNames;
    }
}
