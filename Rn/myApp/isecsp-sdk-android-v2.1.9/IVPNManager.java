package net.l4vpnsdk.vpn;

import android.content.Context;

import net.l4vpnsdk.vpn.struct.IsecspGetPhoneCodePara;
import net.l4vpnsdk.vpn.struct.IsecspGetSessionPara;
import net.l4vpnsdk.vpn.struct.IsecspNetDetectPara;
import net.l4vpnsdk.vpn.struct.IsecspStartSPAPara;
import net.l4vpnsdk.vpn.struct.IsecspStartVPNPara;

/**
 * Interface definitions provided by the SDK
 */
public interface IVPNManager {
    int isecsp_start_spa(IsecspStartSPAPara para);
    int isecsp_get_session(IsecspGetSessionPara para, CommonCallback callback);
    int isecsp_start_vpn(IsecspStartVPNPara para);
    int isecsp_stop_vpn(int logout);
    int isecsp_start_env_action(CommonCallback callback, Context context);
    int isecsp_send_env_diff(String diff);
    int isecsp_get_tunnel_status();
    int isecsp_get_phone_code(IsecspGetPhoneCodePara para);
    int isecsp_tcp_proxy_create(String host, int port);
    int isecsp_tcp_proxy_destroy(int port);
    String isecsp_net_detect(IsecspNetDetectPara isecspNetDetectPara);
    void addSeachDomain(String searchDomain);
    String getLoginReturn();
}
