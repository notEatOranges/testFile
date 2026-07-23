package com.huayao.demo.sim;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.design.widget.BottomSheetBehavior;
import android.support.v7.app.AppCompatActivity;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.AdapterView;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;

import com.huayao.demo.R;

import net.vpnsdk.vpn.VPNManager;

import java.util.ArrayList;
import java.util.List;

public class InputSimInfoActivity extends AppCompatActivity {

    private LinearLayout bottomLin;
    private BottomSheetBehavior mBehavior;
    private Spinner devSpanner, appSpanner, containerSpanner;
    private String selectedDevName, selectedAppName, selectedContainerName;
    private SimInfoListAdapter appAdapter, containerAdapter;
    private TextView simOk;
    private EditText simPinKeyEdit;
    private static SimInputFinishCallback callback;
    private LinearLayout linDevice, linApp, linContainer, linAll;

    public static void jump(Activity activity, int requestCode, SimInputFinishCallback callback) {
        Intent intent = new Intent(activity, InputSimInfoActivity.class);
        activity.startActivityForResult(intent, requestCode);
        activity.overridePendingTransition(R.anim.bottom_eject_in, R.anim.bottom_eject_out);
        InputSimInfoActivity.callback = callback;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        setContentView(R.layout.activity_input_sim_info);
        initView();
        setView();
        setData();
    }

    private void initView() {
        bottomLin = findViewById(R.id.sim_info_bottom_lin);
        mBehavior = BottomSheetBehavior.from(bottomLin);
        devSpanner = findViewById(R.id.sim_spinner_dev);
        appSpanner = findViewById(R.id.sim_spinner_app);
        containerSpanner = findViewById(R.id.sim_spinner_container);
        simOk = findViewById(R.id.sim_ok);
        simPinKeyEdit = findViewById(R.id.sim_pinkey_edit);
        //选择设备：
        linDevice = findViewById(R.id.sim_lin_device);
        //选择应用：
        linApp = findViewById(R.id.sim_lin_app);
        //选择容器：
        linContainer = findViewById(R.id.sim_lin_container);
        //全部：
        linAll = findViewById(R.id.sim_lin_all);
    }

    private void setView() {
        //设置下拉布局
        WindowManager.LayoutParams params = getWindow().getAttributes();
        params.width = (DensityUtil.getScreenWidth(this) * 1);
        params.gravity = Gravity.BOTTOM;
        getWindow().setAttributes(params);
        bottomLin.getLayoutParams().height = DensityUtil.getScreenHeight(this);
        mBehavior.setPeekHeight(bottomLin.getLayoutParams().height);
        mBehavior.setBottomSheetCallback(new BottomSheetBehavior.BottomSheetCallback() {
            @Override
            public void onStateChanged(@NonNull View bottomSheet, int newState) {

            }

            @Override
            public void onSlide(@NonNull View bottomSheet, float slideOffset) {
                if (slideOffset <= -0.3) {
                    finish();
                }
            }
        });
    }

    private void setData() {
        List<SimInfoDevBean> simInfoDevBeans = GetSimInfoUtil.getSimInfo(this);

        //设备列表
        final List<String> devList = new ArrayList<>();
        for (int i = 0; i < simInfoDevBeans.size(); i++) {
            devList.add(simInfoDevBeans.get(i).getDevName());
            if (i == 0) selectedDevName = simInfoDevBeans.get(i).getDevName();
        }
        if (devList.size() <= 1) linDevice.setVisibility(View.GONE);
        SimInfoListAdapter devAdapter = new SimInfoListAdapter(devList, this);
        devSpanner.setAdapter(devAdapter);
        devSpanner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                selectedDevName = devList.get(position);
                refrushAppList();
                refrushContainerList();
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {

            }
        });

        //应用列表
        final List<String> apps = GetSimInfoUtil.getAppsFromDevName(selectedDevName);
        if (apps.size() <= 1) linApp.setVisibility(View.GONE);
        if (apps != null && apps.size() > 0) selectedAppName = apps.get(0);
        appAdapter = new SimInfoListAdapter(apps, this);
        appSpanner.setAdapter(appAdapter);
        appSpanner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                selectedAppName = apps.get(position);
                refrushContainerList();
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {

            }
        });

        //容器列表
        final List<String> containers = GetSimInfoUtil.getContainersFromAppName(selectedDevName, selectedAppName);
        if (containers.size() <= 1) linContainer.setVisibility(View.GONE);
        if (containers != null && containers.size() > 0) selectedContainerName = containers.get(0);
        containerAdapter = new SimInfoListAdapter(containers, this);
        containerSpanner.setAdapter(containerAdapter);
        containerSpanner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                selectedContainerName = containers.get(position);
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {

            }
        });

        simOk.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String pinKey = simPinKeyEdit.getText().toString().trim();
                int errorCode = VPNManager.getInstance().simCheckPinKey(pinKey);
                if (errorCode != 0) {
                    TSnackbar.showTSnack("pin码错误，请重新输入", InputSimInfoActivity.this);
                    return;
                }
                VPNManager.getInstance().simSetInfo(selectedDevName, selectedAppName, selectedContainerName, pinKey);
                if (callback != null) callback.inputFinish();
                finish();
            }
        });
    }

    private void refrushAppList() {
        List<String> apps = GetSimInfoUtil.getAppsFromDevName(selectedDevName);
        linApp.setVisibility(apps.size() <= 1 ? View.GONE : View.VISIBLE);
        appAdapter.setNewData(apps);
        appAdapter.notifyDataSetChanged();
    }

    private void refrushContainerList() {
        List<String> containers = GetSimInfoUtil.getContainersFromAppName(selectedDevName, selectedAppName);
        linContainer.setVisibility(containers.size() <= 1 ? View.GONE : View.VISIBLE);
        containerAdapter.setNewData(containers);
        containerAdapter.notifyDataSetChanged();
    }

    @Override
    public void finish() {
        super.finish();
        overridePendingTransition(R.anim.bottom_eject_in, R.anim.bottom_eject_out);
    }
}