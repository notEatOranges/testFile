package com.huayao.demo;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.text.InputType;
import android.text.TextUtils;
import android.view.View;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemSelectedListener;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.RelativeLayout.LayoutParams;
import android.widget.Spinner;
import android.widget.TextView;

import net.l4vpnsdk.vpn.Common.VpnError;
import net.l4vpnsdk.vpn.CommonCallback;
import net.l4vpnsdk.vpn.VPNAccount;
import net.l4vpnsdk.vpn.VPNManager;
import net.l4vpnsdk.vpn.VPNManager.AAAMethod;
import net.l4vpnsdk.vpn.VPNManager.InputField;
import net.l4vpnsdk.vpn.VPNManager.InputFieldType;
import net.l4vpnsdk.vpn.VPNSdkConstant;
import net.l4vpnsdk.vpn.struct.IsecspGetPhoneCodePara;
import net.l4vpnsdk.vpn.util.LogUtils;

import java.util.ArrayList;

/**
 * This activity is used to input user credentials for both login and device registration.
 */
public class L4LoginActivity extends Activity implements OnItemSelectedListener {

    public final static String LOGIN_PASSWORD_ID = "multi_login_password";
    public final static String DEVICE_REG = "DEVICE_REG";
    public final static String ERROR_CODE = "ERROR_CODE";
    private static final int MAX_DEVICE_LENGTH = 64;
    private static VPNAccount mVpnAccount;
    private LinearLayout mLayout;
    private Spinner mSpinner;
    private RelativeLayout mLayoutDevName;
    private RelativeLayout mLayoutSpinner;
    private RelativeLayout mLayoutUserName;
    private TextView mTitle;
    private EditText mEdtDevName;
    private EditText mEdtUserName;
    private ArrayList<EditText> mPwdEdits = new ArrayList<EditText>();
    private boolean mIsDevReg = false;
    private boolean mOnlyOneMethod = false;
    private boolean mErrorShown = false;
    private AlertDialog mAlertDlg;
    private AAAMethod[] mMethods;
    private int mErrorCode;
    private AAAMethod mSelectedMethod;
    private LinearLayout layoutDycodeLin, layoutSmsLin;
    private ImageView dynamiCodeImg;
    private TextView loginPhoneCodeSend;
    private EditText editPhone, editDycode;
    private EditText editSmsCode;
    private boolean isShowSmsView;

    private final String TAG = "LoginActivity";

    public static VPNAccount getVpnAccount() {
        return mVpnAccount;
    }

    public static void setVpnAccount(VPNAccount account) {
        mVpnAccount = account;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        LogUtils.d(this, TAG, "onCreate");
        super.onCreate(savedInstanceState);
        setTheme(android.R.style.Theme_Holo_Dialog_NoActionBar);
        setContentView(R.layout.login_multi_steps);
        mMethods = L4Activity.getMethods();
        mIsDevReg = getIntent().getExtras().getBoolean(DEVICE_REG);
        mOnlyOneMethod = (1 == mMethods.length);
        mErrorCode = getIntent().getExtras().getInt(ERROR_CODE);
        loadComponents();
        createMethodsDropDownList();
        if (mIsDevReg || mOnlyOneMethod) {
            mSelectedMethod = mMethods[0];
            createInputUI(mSelectedMethod);
        }

        if(mMethods.length == 1){
            onItemSelected(null, null, 0, 0);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();

        if (!mErrorShown) {
            if ((VpnError.ERR_WRONG_USER_PASS == mErrorCode)) {
                alert(getString(R.string.error), getString(R.string.user_pwd_error));
            } else if (mErrorCode > 0) {
                alert(getString(R.string.error), "internal error " + mErrorCode);
            }
            mErrorShown = true;
        }
    }

    @Override
    public void onBackPressed() {
        onCancel();
    }

    @Override
    public void onDestroy() {
        if (mAlertDlg != null) {
            mAlertDlg.dismiss();
        }

        super.onDestroy();
    }

    /**
     * Alert a message dialog.
     *
     * @param title the title of the dialog.
     * @param msg   the message of the dialog.
     */
    private void alert(String title, String msg) {
        mAlertDlg = new AlertDialog.Builder(this).setTitle(title)
                .setMessage(msg)
                .setIcon(android.R.drawable.ic_dialog_info)
                .setNeutralButton(R.string.ok, null).show();
    }

    private void loadComponents() {
        LogUtils.d(this, TAG, "loadComponents");
        mLayout = (LinearLayout) findViewById(R.id.layout_multi_login_pwd);
        mTitle = findViewById(R.id.txtTitle);
        mLayoutSpinner = (RelativeLayout) findViewById(R.id.layout_spinner);
        mLayoutDevName = (RelativeLayout) findViewById(R.id.layout_device_name);
        mLayoutUserName = (RelativeLayout) findViewById(R.id.layout_username);
        mSpinner = (Spinner) findViewById(R.id.spin_methods);
        mSpinner.setOnItemSelectedListener(this);
        mEdtDevName = (EditText) findViewById(R.id.edtDEvicenameMultiLoginVal);
        mEdtUserName = (EditText) findViewById(R.id.edtUsernameMultiLoginVal);
        layoutDycodeLin = findViewById(R.id.layout_dycode);
        layoutSmsLin = findViewById(R.id.layout_sms);
        dynamiCodeImg = findViewById(R.id.dynamic_code_img);
        loginPhoneCodeSend = findViewById(R.id.login_phone_code_send);
        loginPhoneCodeSend.setOnClickListener(new MyClick());
        editDycode = findViewById(R.id.edit_dycode);
        editPhone = findViewById(R.id.edit_phone);
        editSmsCode = findViewById(R.id.edit_sms_code);

        if (mIsDevReg) {
            mLayoutDevName.setVisibility(View.VISIBLE);
            mTitle.setText(R.string.dev_reg);
        } else {
            mLayoutDevName.setVisibility(View.GONE);
        }
    }

    /**
     * Create the DropDown list for authentication methods.
     */
    private void createMethodsDropDownList() {
        final String[] arr_methods = new String[mMethods.length];
        // Only one method exists.
        if (mIsDevReg || mOnlyOneMethod) {
            mLayoutSpinner.setVisibility(View.GONE);
        } else {
            for (int i = 0; i < mMethods.length; i++) {
                AAAMethod method = mMethods[i];
                arr_methods[i] = method.getName();
            }
            ArrayAdapter<String> adapter = new ArrayAdapter<String>(
                    this, R.layout.spinner_method, arr_methods);
            adapter.setDropDownViewResource(R.layout.spinner_method);
            mSpinner.setAdapter(adapter);
        }
    }

    /**
     * Create an EditText component for password input.
     *
     * @param text the name of a server that is responsible for authenticating this password.
     * @param id   the id of an Android EditText object.
     */
    private void createPwdInputUI(String text, int id) {
        RelativeLayout layout = new RelativeLayout(this);
        LayoutParams params = new LayoutParams(LayoutParams.MATCH_PARENT,
                LayoutParams.WRAP_CONTENT);
        layout.setLayoutParams(params);
        mLayout.addView(layout);

        TextView txtPassword = new TextView(this);
        txtPassword.setId(id);
        txtPassword.setText(text);
        params = new LayoutParams(getResources().getDimensionPixelSize(R.dimen.multi_step_login_txt_width),
                LayoutParams.WRAP_CONTENT);
        params.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
        txtPassword.setLayoutParams(params);
        txtPassword.setTextAppearance(this, android.R.style.TextAppearance_Medium);
        layout.addView(txtPassword);

        EditText edtPassword = new EditText(this);
        params = new LayoutParams(LayoutParams.WRAP_CONTENT,
                LayoutParams.WRAP_CONTENT);
        params.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
        params.addRule(RelativeLayout.RIGHT_OF, txtPassword.getId());
        edtPassword.setLayoutParams(params);
        edtPassword.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        layout.addView(edtPassword);

        mPwdEdits.add(edtPassword);
    }

    /**
     * Create the UI for credentials input according to the given authentication method.
     *
     * @param method the method that a user chooses for authentication.
     */
    private void createInputUI(AAAMethod method) {
        int id = 0, pwdnum = 1;
        String lbltext = "";
        mLayout.removeAllViews();
        mPwdEdits.clear();
        mLayoutUserName.setVisibility(View.GONE);
        mLayoutDevName.setVisibility(View.GONE);
        for (int i = 0; i < method.getInputFieldCount(); i++) {
            InputField field = method.getInputField(i);
            InputFieldType type = field.getType();
            switch (type) {
                case USERNAME:
                    mLayoutUserName.setVisibility(View.VISIBLE);
                    // field.getInputString() is not empty, that means the server sent a user name to the client.
                    if ((field.getInputString() != null) && (field.getInputString().length() > 0)) {
                        // Show the name to a user
                        mEdtUserName.setText(field.getInputString());
                        // This name is not allowed to edit
                        mEdtUserName.setEnabled(false);
                    }
                    break;
                case DEVICENAME:
                    mLayoutDevName.setVisibility(View.VISIBLE);
                    break;
                case PASSWORD:
                    id = getResources().getIdentifier(LOGIN_PASSWORD_ID + pwdnum, "id", getApplication().getPackageName());
                    if (1 == pwdnum) {
                        lbltext = getString(R.string.lblPassword);
                    } else {
                        lbltext = getString(R.string.lblPassword) + "(" + field.getDescription() + ")";
                    }
                    pwdnum++;
                    createPwdInputUI(lbltext, id);
                    break;
            }
        }
    }

    public void clickLogin(View view) {
        LogUtils.d(this, TAG, "clickLogin");
        if (!isInputValid() && !isShowSmsView) {
            return;
        }
        VPNSdkConstant.dynamicCode = editDycode.getText().toString();
        VPNSdkConstant.phoneNumber = editPhone.getText().toString();
        VPNSdkConstant.phoneCode = editSmsCode.getText().toString();
        int editIndex = 0;
        EditText edt;
        for (int i = 0; i < mSelectedMethod.getInputFieldCount(); i++) {
            InputField field = mSelectedMethod.getInputField(i);
            InputFieldType type = field.getType();
            switch (type) {
                case USERNAME:
                    // input a user name.
                    edt = (EditText) findViewById(R.id.edtUsernameMultiLoginVal);
                    field.setInputString(edt.getText().toString().trim());
                    break;
                case DEVICENAME:
                    // input a device name.
                    field.setInputString(mEdtDevName.getText().toString().trim());
                    break;
                case PASSWORD:
                    // input a password.
                    edt = mPwdEdits.get(editIndex);
                    field.setInputString(edt.getText().toString());
                    editIndex++;
                    break;
            }
        }
        if (mIsDevReg) {
            VPNManager.getInstance().registerWithMethod(mSelectedMethod);
        } else {
            VPNManager.getInstance().loginWithMethod(mSelectedMethod);
        }
        finish();
    }

    public void clickCancel(View view) {
        LogUtils.d(this, TAG, "clickCancel");
        onCancel();
    }

    /**
     * A user want to cancel the login or device registration process.
     */
    private void onCancel() {
        if (mIsDevReg) {
            VPNManager.getInstance().registerWithMethod(null);
        } else {
            VPNManager.getInstance().loginWithMethod(null);
        }
        finish();
    }

    /**
     * Check whether the user inputs are valid.
     *
     * @return true if all the user inputs are valid.
     */
    private boolean isInputValid() {
        if (mLayoutDevName.getVisibility() == View.VISIBLE) {
            if (mEdtDevName.getText().toString().isEmpty()) {
                LogUtils.w(this, TAG, "Device name is empty.");
                alert(getString(R.string.warning), getString(R.string.device_empty));
                return false;
            }
        }

        if (mLayoutDevName.getVisibility() == View.VISIBLE) {
            if (mEdtDevName.getText().toString().trim().length() > MAX_DEVICE_LENGTH) {
                LogUtils.w(this, TAG, "device name's length > 64");
                alert(getString(R.string.warning), getString(R.string.device_not_valid));
                return false;
            }
        }

        if (mLayoutUserName.getVisibility() == View.VISIBLE) {
            if (mEdtUserName.getText().toString().isEmpty()) {
                LogUtils.w(this, TAG, "username is empty");
                alert(getString(R.string.warning), getString(R.string.user_empty));
                return false;
            }
        }
        for (int i = 0; i < mPwdEdits.size(); i++) {
            EditText edit = mPwdEdits.get(i);
            if (edit.getText().toString().isEmpty()) {
                alert(getString(R.string.warning), getString(R.string.password_empty));
                return false;
            }
        }
        return true;
    }

    public int currentPosition = 0;

    @Override
    public void onItemSelected(AdapterView<?> parent, View view, int pos,
                               long id) {
        currentPosition = pos;
        mSelectedMethod = mMethods[pos];
        createInputUI(mSelectedMethod);

        // 当前选中的方法是否需要需要动态码
        boolean isShowDycodeView = !TextUtils.isEmpty(VPNManager.getInstance().vpnLoginInfoBean.getAaa_method().get(pos).getVcode_url());
        LogUtils.d(this, TAG, "Whether dynamic code is required : " + isShowDycodeView);
        layoutDycodeLin.setVisibility(isShowDycodeView ? View.VISIBLE : View.GONE);
        if(isShowDycodeView){
            String url = VPNManager.getInstance().vpnLoginInfoBean.getAaa_method().get(pos).getVcode_url();
            VPNManager.getInstance().getDynamicCode(url, new CommonCallback() {
                @Override
                public void result(Object obj, String info) {
                    byte[] status = (byte[]) obj;
                    dynamiCodeImg.setImageBitmap(BitmapFactory.decodeByteArray(status, 0, status.length));
                    LogUtils.d(L4LoginActivity.this, TAG, "dynamic code info : " + info);
                    VPNSdkConstant.dynamicCodeRandom = info;
                }
            });
        }

        isShowSmsView = !TextUtils.isEmpty(VPNManager.getInstance().vpnLoginInfoBean.getAaa_method().get(pos).getSms_url());
        if(isShowSmsView){
            mLayoutUserName.setVisibility(View.GONE);
            mLayout.setVisibility(View.GONE);
            layoutSmsLin.setVisibility(View.VISIBLE);
        }else{
            mLayout.setVisibility(View.VISIBLE);
            layoutSmsLin.setVisibility(View.GONE);
        }
    }

    class MyClick implements View.OnClickListener {

        @Override
        public void onClick(View v) {
            String url = VPNManager.getInstance().vpnLoginInfoBean.getAaa_method().get(currentPosition).getSms_url();
            VPNManager.getInstance().isecsp_get_phone_code(new IsecspGetPhoneCodePara(url, VPNSdkConstant.dynamicCode, editPhone.getText().toString()));
        }
    }

    @Override
    public void onNothingSelected(AdapterView<?> arg0) {
        // do nothing
    }
}