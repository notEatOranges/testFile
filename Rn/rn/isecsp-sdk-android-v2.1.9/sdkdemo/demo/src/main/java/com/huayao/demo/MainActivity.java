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
import android.widget.RadioGroup;
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

import net.vpnsdk.vpn.Common;
import net.vpnsdk.vpn.Common.VpnMsg;
import net.vpnsdk.vpn.VPNManager;
import net.vpnsdk.vpn.VPNManager.AAAMethod;
import net.vpnsdk.vpn.mauth.MAuthUtil;
import net.vpnsdk.vpn.struct.IsecspLoginMethod;
import net.vpnsdk.vpn.struct.IsecspStartSPAPara;
import net.vpnsdk.vpn.struct.IsecspStartVPNPara;
import net.vpnsdk.vpn.util.LogUtils;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

import cn.com.infosec.mobile.android.util.Util;

public class MainActivity extends Activity {

    private static AAAMethod[] mMethods = null;
    LinearLayout llSpa;
    EditText mTextServer, mTextMethod, mTextUser, mTextPass, spaSharedPsEdit, certPassEdit, etSpaAddress, etSpaPort, etSpaUsername, etSpaPassword, textCustomer1;
    TextView mL3Status, mL4Status, buttonSettings, buttonAddCert, certPathTv;
    RadioGroup rgProtocol;
    private String Tag = "VPNSDKDemo";
    private Button startVPN;
    private boolean isStartSPA = false;
    private int OPEN_FILESELECT_REQUEST_CODE = 102;
    private String certPath = "";
    public String mXTSignResult = null;
    private Object object = new Object();
    private boolean sendingSpa = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        setContentView(R.layout.main);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 102);
        }
        CommonConfig.DEVICE_ID = Util.getIdentifier(this);
        ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.READ_PHONE_STATE}, 1);

        mTextServer = findViewById(R.id.textServer);
        mTextUser = findViewById(R.id.textUser);
        mTextPass = findViewById(R.id.textPass);
        mTextMethod = findViewById(R.id.textMethod);
        mL3Status = findViewById(R.id.textL3Status);
        buttonSettings = findViewById(R.id.buttonSettings);
        startVPN = findViewById(R.id.buttonVPN);
        buttonAddCert = findViewById(R.id.buttonAddCert);
        certPathTv = findViewById(R.id.certPathTv);
        certPassEdit = findViewById(R.id.certPassEdit);
        llSpa = findViewById(R.id.ll_spa);
        spaSharedPsEdit = findViewById(R.id.spa_shared_ps);
        etSpaAddress = findViewById(R.id.et_spa_address);
        etSpaPort = findViewById(R.id.et_spa_port);
        etSpaUsername = findViewById(R.id.et_spa_username);
        etSpaPassword = findViewById(R.id.et_spa_pwd);
        textCustomer1 = findViewById(R.id.textCustomer1);
        rgProtocol = findViewById(R.id.rg_protocol);
        setVPNStatusCallback();
        getVPNStatus();

        setView();
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
        rgProtocol.setOnCheckedChangeListener((group, checkedId) -> {
            VPNManager.getInstance().set_ssl_protocol(getSSLProtocolByID(checkedId));
        });
        checkSSLProtocol(VPNManager.getInstance().get_ssl_protocol());
    }

    private int getSSLProtocolByID(int checkedId) {
        int sslProtocol;
        switch (checkedId) {
            case R.id.rb_tls10:
                sslProtocol = VPNManager.getInstance().SSL_PROTOCOL_TLS10;
                break;
            case R.id.rb_tls12:
                sslProtocol = VPNManager.getInstance().SSL_PROTOCOL_TLS12;
                break;
            case R.id.rb_sslv3:
                sslProtocol = VPNManager.getInstance().SSL_PROTOCOL_SSLV3;
                break;
            case R.id.rb_sm2:
                sslProtocol = VPNManager.getInstance().SSL_PROTOCOL_SM2;
                break;
            default:
                sslProtocol = VPNManager.getInstance().SSL_PROTOCOL_INIT;
                break;
        }
        LogUtils.i(this, Tag, "set ssl protocol " + sslProtocol);
        return sslProtocol;
    }

    private void checkSSLProtocol(int sslProtocol) {
        LogUtils.i(this, Tag, "get ssl protocol " + sslProtocol);
        switch (sslProtocol) {
            case 1:
                rgProtocol.check(R.id.rb_tls10);
                break;
            case 2:
                rgProtocol.check(R.id.rb_tls12);
                break;
            case 3:
                rgProtocol.check(R.id.rb_sslv3);
                break;
            case 4:
                rgProtocol.check(R.id.rb_sm2);
                break;
            default:
                rgProtocol.check(R.id.rb_init);
                break;
        }
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
        String customer1 = textCustomer1.getText().toString();
        if (TextUtils.isEmpty(vpnServer)) {
            Toast.makeText(MainActivity.this, "请输入服务器地址", Toast.LENGTH_SHORT).show();
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
        if(isStartSPA){
            String spaSharedPs = spaSharedPsEdit.getText().toString(), spaAddress = etSpaAddress.getText().toString(), spaPort = etSpaPort.getText().toString(),
                    spaUsername = etSpaUsername.getText().toString(), spaPassword = etSpaPassword.getText().toString();
            if (TextUtils.isEmpty(spaSharedPs) || spaAddress.equals("") || spaPort.equals("") || spaUsername.equals("") || spaPassword.equals("")) {
                Toast.makeText(MainActivity.this, "请输入参数", Toast.LENGTH_SHORT).show();
                return;
            }
            spaAddress = spaAddress.contains(":") ? spaAddress.split(":")[0] : spaAddress;
            int vpnPort = spaAddress.contains(":") ? Integer.parseInt(spaAddress.split(":")[1]) : port;
            SPAUtils.setSPAPar(spaUsername, spaPassword, spaPort, vpnPort, spaAddress, vpnServer, spaSharedPs);
            String finalVpnServer = vpnServer;
            int finalPort = port;
            mL3Status.setText("sending spa...");
            Log.i(Tag, "MainActivity send SPA");
            new Thread(){
                @Override
                public void run() {
                    super.run();
                    sendingSpa = true;
                    SPAUtils.startSPA();
                    sendingSpa = false;
                    runOnUiThread(() -> {
                        if(MAuthUtil.isUseMAuth){
                            certPath = DemoConfig.mauthCertFilePath;
                        }
                        VPNManager.getInstance().isecsp_start_vpn(new IsecspStartVPNPara(finalVpnServer, finalPort, vpnUsername, vpnPass, "", "", certPath, certPassEdit.getText().toString(), vpnMethod, MAuthUtil.isUseMAuth, customer1));
                    });
                }
            }.start();
            return;
        }

        if(MAuthUtil.isUseMAuth){
            certPath = DemoConfig.mauthCertFilePath;
        }

        VPNManager.getInstance().isecsp_start_vpn(new IsecspStartVPNPara(vpnServer, port, vpnUsername, vpnPass, "", "", certPath, certPassEdit.getText().toString(), vpnMethod, MAuthUtil.isUseMAuth, customer1));
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
                    Log.i(Tag, "L3VPN connecting");
                    mL3Status.setText("L3VPN is connecting...");
                    break;
                case VpnMsg.MSG_VPN_CONNECTED:
                    Log.i(Tag, "L3VPN connected ");
                    mL3Status.setText("L3VPN connected.");
                    startVPN.setText(R.string.disconnect_l3);
                    break;
                case VpnMsg.MSG_VPN_DISCONNECTING:
                    Log.i(Tag, "L3VPN disconnecting ");
                    mL3Status.setText("L3VPN is disconnecting...");
                    break;
                case VpnMsg.MSG_VPN_DISCONNECTED:
                    Log.i(Tag, "L3VPN disconnected");
                    mL3Status.setText("L3VPN is not running.");
                    startVPN.setText(R.string.connect_l3);
                    int errorCode = msg.getData().getInt(VpnMsg.MSG_VPN_ERROR_CODE);
                    if (errorCode != Common.VpnError.ERR_INTERRUPTED) {
                        Toast.makeText(MainActivity.this, "错误码：" + msg.getData().getInt(VpnMsg.MSG_VPN_ERROR_CODE), Toast.LENGTH_SHORT).show();
                    }
                    break;
                case VpnMsg.MSG_VPN_CONNECT_FAILED:
                    Log.i(Tag, "L3VPN connect failed");
                    mL3Status.setText("L3VPN is not running.");
                    startVPN.setText(R.string.connect_l3);
                    Toast.makeText(MainActivity.this, "错误码：" + msg.getData().getInt(VpnMsg.MSG_VPN_ERROR_CODE), Toast.LENGTH_SHORT).show();
                    break;
                case VpnMsg.MSG_VPN_RECONNECTING:
                    Log.i(Tag, "L3VPN reconnecting");
                    mL3Status.setText("L3VPN is reconnecting...");
                    break;
                case VpnMsg.MSG_VPN_LOGIN:
                    int error = msg.getData().getInt(VpnMsg.MSG_VPN_ERROR_CODE);
                    IsecspLoginMethod methods = (IsecspLoginMethod) (msg.obj);
                    mMethods = methods.getmMethods();
                    if (0 == mMethods.length) {
                        VPNManager.getInstance().cancelLogin();
                    }
                    Intent intent2 = new Intent(MainActivity.this, LoginActivity.class);
                    intent2.putExtra(LoginActivity.DEVICE_REG, false);
                    intent2.putExtra(LoginActivity.ERROR_CODE, error);
                    MainActivity.this.startActivity(intent2);
                    break;
                case VpnMsg.MSG_VPN_DEVREG:
                    mMethods = (AAAMethod[]) (msg.obj);
                    Intent intent = new Intent(MainActivity.this, LoginActivity.class);
                    intent.putExtra(LoginActivity.DEVICE_REG, true);
                    MainActivity.this.startActivity(intent);
                    break;
                case VpnMsg.MSG_VPN_ENV:
                    String envConfig = (String) msg.obj;
                    Log.i(Tag, "onVpnClientSecurityRuleCheck, config: "+envConfig);
                    EnvCheckConfigBean envCheckConfigBean = new Gson().fromJson(envConfig, EnvCheckConfigBean.class);
                    AutoEnvCheckActivity.jumpAutoEnvCheckActivity(MainActivity.this, envCheckConfigBean);
//                    VPNManager.getInstance().isecsp_get_env_result(new CommonCallback() {
//                        @Override
//                        public void result(Object obj, String info) {
//                            VPNManager.getInstance().set_env_result(((EnvCheckResultBean) obj).getResultStr());
//                        }
//                    }, MainActivity.this);
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
        if(requestCode == OPEN_FILESELECT_REQUEST_CODE){
            if (data == null) return;
            Uri uri = data.getData();
            ContentResolver contentResolver = getContentResolver();
            String fileType = MimeTypeMap.getSingleton().getExtensionFromMimeType(contentResolver.getType(uri));
            if(!fileType.equals("pfx") && !fileType.equals("p12") && !fileType.equals("crt")) {
                Toast.makeText(MainActivity.this,"请选择正确的证书", Toast.LENGTH_SHORT).show();
                return;
            }
            String displayName = System.currentTimeMillis() + "uritofile" + DocumentFile.fromSingleUri(MainActivity.this, uri).getName();
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
            } catch (FileNotFoundException e) {
                e.printStackTrace();
            } catch (IOException e) {
                e.printStackTrace();
            }
            return;
        }
        VPNManager.getInstance().onActivityResult(requestCode, resultCode);
    }

    public void startSKF(View view) {
        GetSimInfoUtil.getSimInfo(MainActivity.this);
        if (VPNManager.getInstance().isPinKey() == -1) {
            InputSimInfoActivity.jump(MainActivity.this, -1, new SimInputFinishCallback() {
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

    public void goSettings(View view) {
        Intent intent = new Intent(this, SettingsActivity.class);
        startActivity(intent);
    }

    public void goL4VPN(View view) {
        Intent intent = new Intent(MainActivity.this, L4Activity.class);
        startActivity(intent);
    }

    /**
     * 添加MAuth证书
     * @param view
     */
    public void buttonAddMAuthCert(View view) {
        String server = mTextServer.getText().toString().trim();
        if(TextUtils.isEmpty(server)){
            Toast.makeText(this, "请输入服务器地址", Toast.LENGTH_SHORT).show();
            return;
        }
        if(!server.contains(":")){
            server = server + ":443";
        }

        Intent intent = new Intent(MainActivity.this, MAuthActivity.class);
        intent.putExtra("server", server);
        startActivity(intent);
    }
}