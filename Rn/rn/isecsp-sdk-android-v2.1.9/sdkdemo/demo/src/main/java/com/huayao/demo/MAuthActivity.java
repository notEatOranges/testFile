package com.huayao.demo;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.EditText;
import android.widget.Toast;

import com.google.gson.Gson;
import com.huayao.demo.bean.MAuthGetCodeBean;

import net.arraynetworks.vpn.NativeLib;
import net.vpnsdk.vpn.CommonCallback;
import net.vpnsdk.vpn.VPNManager;
import net.vpnsdk.vpn.mauth.MAuthUtil;

import cn.com.infosec.mobile.android.IMSSdk;
import cn.com.infosec.mobile.android.result.Result;
import cn.com.infosec.mobile.android.util.Util;
import cn.com.infosec.mobile.tls.TLSAndroidUtils;

public class MAuthActivity extends AppCompatActivity {

    String server = "";
    private EditText editUsername, editCode;
    private final String DEFAULT_PIN_CODE = "123456";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_m_auth);
        server = getIntent().getStringExtra("server");

        editUsername = findViewById(R.id.edit_username);
        editCode = findViewById(R.id.edit_code);
    }

    /**
     * 1. 获取MAuth注册码
     * @param view
     */
    public void getMAuthCode(View view) {
        String userName = editUsername.getText().toString().trim();
        if(TextUtils.isEmpty(userName)){
            Toast.makeText(this, "请输入用户名", Toast.LENGTH_SHORT).show();
            return;
        }

        SPAUtils.startSPA();
        String result = VPNManager.getInstance().isecsp_get_mauth_code(server, userName, "");
        MAuthGetCodeBean mAuthGetCodeBean = new Gson().fromJson(result, MAuthGetCodeBean.class);
        if(mAuthGetCodeBean.getResultcode().equals("000000")){
            Toast.makeText(this, "获取注册码成功，请查收邮件或短信", Toast.LENGTH_SHORT).show();
        } else {
            Toast.makeText(this, mAuthGetCodeBean.getMsg(), Toast.LENGTH_SHORT).show();
        }
    }

    /**
     * 2. 初始化SDK
     * @param view
     */
    public void initSDK(View view) {
        String userName = editUsername.getText().toString().trim();
        if(TextUtils.isEmpty(userName)){
            Toast.makeText(this, "请输入用户名", Toast.LENGTH_SHORT).show();
            return;
        }

        String code = editCode.getText().toString().trim();
        if(TextUtils.isEmpty(code)){
            Toast.makeText(this, "请输入注册码", Toast.LENGTH_SHORT).show();
            return;
        }

        SPAUtils.startSPA();
        DemoConfig.mauthCertFilePath = "/data/data/com.huayao.demo/files/"+userName+".cer";
        VPNManager.getInstance().isecsp_initialization(this, server, DemoConfig.APP_ID, DemoConfig.APP_SECRET,userName, code, DEFAULT_PIN_CODE, new CommonCallback() {
            @Override
            public void result(Object obj, String info) {
                Result result = (Result) obj;
                if(result.getResultID().equals("000000")){
                    Toast.makeText(MAuthActivity.this, "初始化成功", Toast.LENGTH_SHORT).show();
                }else{
                    Toast.makeText(MAuthActivity.this, result.getResultDesc(), Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    /**
     * 下载证书
     * @param view
     */
    public void downloadCert(View view) {
        String userName = editUsername.getText().toString().trim();
        if(TextUtils.isEmpty(userName)){
            Toast.makeText(this, "请输入用户名", Toast.LENGTH_SHORT).show();
            return;
        }

        SPAUtils.startSPA();
        VPNManager.getInstance().isecsp_request_cert(userName, DEFAULT_PIN_CODE, this, new CommonCallback() {
            @Override
            public void result(Object obj, String info) {
                DemoConfig.mauthCertFilePath = info;
                MAuthUtil.isUseMAuth = true;
                Toast.makeText(MAuthActivity.this, "下载证书成功："+info, Toast.LENGTH_SHORT).show();
            }
        });
    }
}