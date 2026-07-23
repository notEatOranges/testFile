package com.huayao.demo;

import android.Manifest;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.support.v4.app.ActivityCompat;
import android.support.v4.provider.DocumentFile;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.webkit.MimeTypeMap;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.android.common.constant.CommonConfig;
import com.google.gson.Gson;
import com.huayao.demo.sim.GetSimInfoUtil;
import com.huayao.demo.sim.InputSimInfoActivity;
import com.huayao.demo.sim.SimInputFinishCallback;
import com.xui.environment.check.bean.EnvCheckConfigBean;
import com.xui.environment.check.constant.EnvConstant;
import com.xui.environment.check.env.AutoEnvCheckActivity;
import com.xui.environment.check.utils.GetInstalledAppUtil;

import net.l4vpnsdk.vpn.Common;
import net.l4vpnsdk.vpn.Common.VpnMsg;
import net.l4vpnsdk.vpn.VPNManager;
import net.l4vpnsdk.vpn.VPNManager.AAAMethod;
import net.l4vpnsdk.vpn.struct.IsecspLoginMethod;
import net.l4vpnsdk.vpn.struct.IsecspStartSPAPara;
import net.l4vpnsdk.vpn.struct.IsecspStartVPNPara;
import net.vpnsdk.vpn.mauth.MAuthUtil;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

public class L4Activity extends Activity {

    private static AAAMethod[] mMethods = null;
    LinearLayout llSpa;
    EditText mTextServer, mTextMethod, mTextUser, mTextPass, spaSharedPsEdit, certPassEdit, etTcpHost, etTcpPort,
            etSpaAddress, etSpaPort, etSpaUsername, etSpaPassword, etUrl;
    TextView mStatus, buttonSettings, buttonAddCert, certPathTv, tvTcpResult;
    private String Tag = "VPNSDKDemo";
    private Button startVPN;
    private boolean isStartSPA = false;
    private int OPEN_FILESELECT_REQUEST_CODE = 102;
    private String certPath = "", tcpProxyCreateResult = "";
    public String mXTSignResult = null;
    private Object object = new Object();
    private boolean sendingSpa = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        setContentView(R.layout.activity_l4_main);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 102);
        }
        CommonConfig.DEVICE_ID = "123456789";
        ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.READ_PHONE_STATE}, 1);

        mTextServer = findViewById(R.id.textServer);
        mTextUser = findViewById(R.id.textUser);
        mTextPass = findViewById(R.id.textPass);
        mTextMethod = findViewById(R.id.textMethod);
        mStatus = findViewById(R.id.textStatus);
        buttonSettings = findViewById(R.id.buttonSettings);
        llSpa = findViewById(R.id.ll_spa);
        spaSharedPsEdit = findViewById(R.id.spa_shared_ps);
        etSpaAddress = findViewById(R.id.et_spa_address);
        etSpaPort = findViewById(R.id.et_spa_port);
        etSpaUsername = findViewById(R.id.et_spa_username);
        etSpaPassword = findViewById(R.id.et_spa_pwd);
        startVPN = findViewById(R.id.buttonVPN);
        buttonAddCert = findViewById(R.id.buttonAddCert);
        certPathTv = findViewById(R.id.certPathTv);
        certPassEdit = findViewById(R.id.certPassEdit);
        etTcpHost = findViewById(R.id.et_tcp_host);
        etTcpPort = findViewById(R.id.et_tcp_port);
        tvTcpResult = findViewById(R.id.tv_tcp_result);
        etUrl = findViewById(R.id.et_url);
        setView();

        setVPNStatusCallback();
        getVPNStatus();
        initData();
    }

    private void initData() {
        if (getVPNStatus() == Common.VpnStatus.CONNECTED) {
            mStatus.setText("L4VPN connected.");
            startVPN.setText(R.string.disconnect_l4);
        }
    }

    private void setView() {
        buttonSettings.setOnClickListener(v -> {
            isStartSPA = !isStartSPA;
            llSpa.setVisibility(isStartSPA ? View.VISIBLE : View.GONE);
            buttonSettings.setText(isStartSPA ? "关闭SPA" : "开启SPA");
            if (isStartSPA) {
                etSpaAddress.setText(mTextServer.getText().toString());
                etSpaPort.setText("60021");
            }
        });
        buttonAddCert.setOnClickListener(v -> {
            Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.setType("*/*");
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            startActivityForResult(intent, OPEN_FILESELECT_REQUEST_CODE);
        });
    }

    /**
     * 设置VPN状态回调监听
     */
    public void setVPNStatusCallback() {
        VPNManager.initialize(this).set_callback(callbackHandler);
    }

    /**
     * 启动VPN
     *
     * @param view
     */
    public void startVPN(View view) {
        if (sendingSpa) {
            return;
        }
        // VPN启动中，点击停止VPN
        if (getVPNStatus() != Common.VpnStatus.IDLE) {
            stopVPN();
            return;
        }

        String vpnServer = mTextServer.getText().toString();
        String vpnUsername = mTextUser.getText().toString();
        String vpnPass = mTextPass.getText().toString();
        String vpnMethod = mTextMethod.getText().toString();
        if (TextUtils.isEmpty(vpnServer)) {
            Toast.makeText(L4Activity.this, "请输入服务器地址", Toast.LENGTH_SHORT).show();
            return;
        }

        // 是否输入了端口号, 默认443
        int port = 443;
        if (vpnServer.contains(":")) {
            String[] hostAndPort = vpnServer.split(":");
            vpnServer = hostAndPort[0];
            port = Integer.parseInt(hostAndPort[1]);
        }

        // 判断连接前是否需要开启SPA
        if (isStartSPA) {
            String spaSharedPs = spaSharedPsEdit.getText().toString(), spaAddress = etSpaAddress.getText().toString(), spaPort = etSpaPort.getText().toString(),
                    spaUsername = etSpaUsername.getText().toString(), spaPassword = etSpaPassword.getText().toString();
            if (TextUtils.isEmpty(spaSharedPs) || spaAddress.equals("") || spaPort.equals("") || spaUsername.equals("") || spaPassword.equals("")) {
                Toast.makeText(L4Activity.this, "请输入参数", Toast.LENGTH_SHORT).show();
                return;
            }
            spaAddress = spaAddress.contains(":") ? spaAddress.split(":")[0] : spaAddress;
            int vpnPort = spaAddress.contains(":") ? Integer.parseInt(spaAddress.split(":")[1]) : port;
            String finalVpnServer = vpnServer, finalSpaAddress = spaAddress;
            int finalPort = port;
            mStatus.setText("sending spa...");
            Log.i(Tag, "L4Activity send SPA");
            new Thread(){
                @Override
                public void run() {
                    super.run();
                    sendingSpa = true;
                    VPNManager.getInstance().isecsp_start_spa(new IsecspStartSPAPara(spaUsername, spaPassword, VPNManager.getInstance().getDeviceId(), Integer.parseInt(spaPort), vpnPort, finalSpaAddress, finalVpnServer, spaSharedPs, 1, 2));
                    sendingSpa = false;
                    runOnUiThread(() -> {
                        if (MAuthUtil.isUseMAuth) {
                            certPath = MAuthUtil.signCertPath;
                        }
                        VPNManager.getInstance().set_ssl_protocol(VPNManager.getInstance().SSL_PROTOCOL_SM2);
                        VPNManager.getInstance().isecsp_start_vpn(new IsecspStartVPNPara(finalVpnServer, finalPort, vpnUsername, vpnPass, "", "", certPath, certPassEdit.getText().toString(), vpnMethod, MAuthUtil.isUseMAuth, ""));
                    });
                }
            }.start();
            return;
        }

        if (MAuthUtil.isUseMAuth) {
            certPath = MAuthUtil.signCertPath;
        }

        VPNManager.getInstance().set_ssl_protocol(VPNManager.getInstance().SSL_PROTOCOL_SM2);
        VPNManager.getInstance().isecsp_start_vpn(new IsecspStartVPNPara(vpnServer, port, vpnUsername, vpnPass, "", "", certPath, certPassEdit.getText().toString(), vpnMethod, MAuthUtil.isUseMAuth, ""));
    }

    /**
     * 停止VPN
     */
    public void stopVPN() {
        VPNManager.getInstance().isecsp_stop_vpn(1);
    }

    /**
     * 获取VPN当前状态
     */
    public int getVPNStatus() {
        int vpnStatus = VPNManager.getInstance().isecsp_get_tunnel_status();
        Log.i(Tag, "getVPNStatus: " + vpnStatus);
        return vpnStatus;
    }

    private Handler callbackHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            Log.i(Tag, "handleMessage " + msg.what);
            switch (msg.what) {
                case VpnMsg.MSG_VPN_CONNECTING:
                    Log.i(Tag, "L4VPN connecting");
                    mStatus.setText("L4VPN is connecting...");
                    break;
                case VpnMsg.MSG_VPN_CONNECTED:
                    Log.i(Tag, "L4VPN connected ");
                    mStatus.setText("L4VPN connected.");
                    startVPN.setText(R.string.disconnect_l4);
                    break;
                case VpnMsg.MSG_VPN_DISCONNECTING:
                    Log.i(Tag, "L4VPN disconnecting ");
                    mStatus.setText("L4VPN is disconnecting...");
                    break;
                case VpnMsg.MSG_VPN_DISCONNECTED:
                    Log.i(Tag, "L4VPN disconnected");
                    mStatus.setText("L4VPN is not running.");
                    startVPN.setText(R.string.connect_l4);
                    int errorCode = msg.getData().getInt(VpnMsg.MSG_VPN_ERROR_CODE);
                    if (errorCode != Common.VpnError.ERR_INTERRUPTED) {
                        Toast.makeText(L4Activity.this, "错误码：" + msg.getData().getInt(VpnMsg.MSG_VPN_ERROR_CODE), Toast.LENGTH_SHORT).show();
                    }
                    break;
                case VpnMsg.MSG_VPN_CONNECT_FAILED:
                    Log.i(Tag, "L4VPN connect failed");
                    mStatus.setText("L4VPN is not running.");
                    startVPN.setText(R.string.connect_l4);
                    Toast.makeText(L4Activity.this, "错误码：" + msg.getData().getInt(VpnMsg.MSG_VPN_ERROR_CODE), Toast.LENGTH_SHORT).show();
                    break;
                case VpnMsg.MSG_VPN_RECONNECTING:
                    Log.i(Tag, "L4VPN reconnecting");
                    mStatus.setText("L4VPN is reconnecting...");
                    break;
                case VpnMsg.MSG_VPN_LOGIN:
                    int error = msg.getData().getInt(VpnMsg.MSG_VPN_ERROR_CODE);
                    IsecspLoginMethod methods = (IsecspLoginMethod) (msg.obj);
                    mMethods = methods.getmMethods();
                    if (0 == mMethods.length) {
                        VPNManager.getInstance().cancelLogin();
                    }
                    Intent intent2 = new Intent(L4Activity.this, L4LoginActivity.class);
                    intent2.putExtra(L4LoginActivity.DEVICE_REG, false);
                    intent2.putExtra(L4LoginActivity.ERROR_CODE, error);
                    L4Activity.this.startActivity(intent2);
                    break;
                case VpnMsg.MSG_VPN_DEVREG:
                    mMethods = (AAAMethod[]) (msg.obj);
                    Intent intent = new Intent(L4Activity.this, L4LoginActivity.class);
                    intent.putExtra(L4LoginActivity.DEVICE_REG, true);
                    L4Activity.this.startActivity(intent);
                    break;
                case VpnMsg.MSG_VPN_ENV:
                    String envConfig = (String) msg.obj;
                    Log.i(Tag, "onVpnClientSecurityRuleCheck, config: " + envConfig);
                    EnvCheckConfigBean envCheckConfigBean = new Gson().fromJson(envConfig, EnvCheckConfigBean.class);
                    AutoEnvCheckActivity.jumpAutoEnvCheckActivity(L4Activity.this, envCheckConfigBean);
                    break;
                default:
                    super.handleMessage(msg);
            }
        }
    };

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        Log.d(Tag, "onActivityResult");
        if (requestCode == EnvConstant.ENV_CHECKED_RESULT_CODE && resultCode == EnvConstant.ENV_CHECKED_RESULT_CODE) {
            VPNManager.getInstance().set_env_result(data.getStringExtra(EnvConstant.ENV_CHECKED_RESULT_VALUE));
            return;
        }
        if (requestCode == OPEN_FILESELECT_REQUEST_CODE) {
            if (data == null) return;
            Uri uri = data.getData();
            ContentResolver contentResolver = getContentResolver();
            String fileType = MimeTypeMap.getSingleton().getExtensionFromMimeType(contentResolver.getType(uri));
            if (!fileType.equals("pfx") && !fileType.equals("p12") && !fileType.equals("crt")) {
                Toast.makeText(L4Activity.this, "请选择正确的证书", Toast.LENGTH_SHORT).show();
                return;
            }
            String displayName = System.currentTimeMillis() + "uritofile" + DocumentFile.fromSingleUri(L4Activity.this, uri).getName();
            InputStream is = null;
            try {
                is = contentResolver.openInputStream(uri);
                File cache = new File(getCacheDir().getAbsolutePath(), displayName);
                FileOutputStream fos = new FileOutputStream(cache);
                byte[] b = new byte[1024];
                while ((is.read(b)) != -1) {
                    fos.write(b);
                }
                certPath = cache.getAbsolutePath();
                certPathTv.setText(certPath);
                certPassEdit.setVisibility(View.VISIBLE);
                fos.close();
                is.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
            return;
        }
        VPNManager.getInstance().onActivityResult(requestCode, resultCode);
    }

    public void startSKF(View view) {
        GetSimInfoUtil.getSimInfo(L4Activity.this);
        if (VPNManager.getInstance().isPinKey() == -1) {
            InputSimInfoActivity.jump(L4Activity.this, -1, new SimInputFinishCallback() {
                @Override
                public void inputFinish() {
                    startVPN(null);
                }
            });
        }
    }

    public static AAAMethod[] getMethods() {
        return mMethods;
    }

    /**
     * 创建端口
     */
    public void createTcpPort(View view) {
        if (getVPNStatus() != Common.VpnStatus.CONNECTED) {
            Toast.makeText(this, "需要先连接L4VPN", Toast.LENGTH_SHORT).show();
        } else if (etTcpHost.getText().toString().equals("") || etTcpPort.getText().toString().equals("")) {
            Toast.makeText(this, "请输入参数", Toast.LENGTH_SHORT).show();
        } else {
            int port = VPNManager.getInstance().isecsp_tcp_proxy_create(etTcpHost.getText().toString(), Integer.parseInt(etTcpPort.getText().toString()));
            tcpProxyCreateResult = port == 0 ? "端口创建失败" : "127.0.0.1:" + port;
            tvTcpResult.setText(tcpProxyCreateResult);
            etUrl.setText("http://" + tcpProxyCreateResult);
        }
    }

    /**
     * 打开URL
     */
    public void openUrl(View view) {
        if (getVPNStatus() != Common.VpnStatus.CONNECTED) {
            Toast.makeText(this, "需要先连接L4VPN", Toast.LENGTH_SHORT).show();
        } else if (!etUrl.getText().toString().equals("") && !tcpProxyCreateResult.equals("端口创建失败")) {
            openUrlInBrowser(etUrl.getText().toString());
        }
    }

    /**
     * 释放端口
     */
    public void destroyTcpPort(View view) {
        if (!tcpProxyCreateResult.equals("") && !tcpProxyCreateResult.equals("端口创建失败")) {
            int port = Integer.parseInt(tcpProxyCreateResult.split(":")[1]);
            int result = VPNManager.getInstance().isecsp_tcp_proxy_destroy(port);
            Toast.makeText(this, "端口" + port + "释放" + (result == 0 ? "成功" : "失败"), Toast.LENGTH_SHORT).show();
        }
    }

    public void openUrlInBrowser(String url) {
        boolean isInstall = GetInstalledAppUtil.getInstance().checkAppInstalled(this, "com.android.browser");
        if (isInstall) {
            Intent intent = new Intent();
            intent.setAction(Intent.ACTION_VIEW);
            Uri uri = Uri.parse(url);
            intent.setData(uri);
            intent.setClassName("com.android.browser", "com.android.browser.BrowserActivity");
            startActivity(intent);
        } else {
            Uri uri = Uri.parse(url);
            Intent it = new Intent(Intent.ACTION_VIEW, uri);
            startActivity(it);
        }
    }

    public void back(View view) {
        finish();
    }
}