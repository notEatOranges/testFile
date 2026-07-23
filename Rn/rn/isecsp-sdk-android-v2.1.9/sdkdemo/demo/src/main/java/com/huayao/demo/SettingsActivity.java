package com.huayao.demo;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.widget.Switch;
import android.widget.Toast;

import net.vpnsdk.vpn.VPNManager;

public class SettingsActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        setContentView(R.layout.activity_settings);
        initView();
    }

    private void initView() {
        Switch swRealTimeLog = findViewById(R.id.sw_real_time_log);
        swRealTimeLog.setChecked(VPNManager.isSaveLog());
        swRealTimeLog.setOnCheckedChangeListener((buttonView, isChecked) -> {
            VPNManager.getInstance().set_is_save_log(isChecked);
        });
    }

    public void goBack(View view) {
        finish();
    }

    public void sendRealTimeLog(View view) {
        VPNManager.getInstance().send_real_time_log(this);
    }

    public void exportLogToFile(View view) {
        String path = VPNManager.getInstance().export_log_to_file(this);
        Toast.makeText(this, "日志路径：" + path, Toast.LENGTH_SHORT).show();
    }

    public void sendLog(View view) {
        VPNManager.getInstance().send_log(this);
    }
}