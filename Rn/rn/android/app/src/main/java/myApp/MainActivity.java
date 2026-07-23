import com.getui.push.GetuiSdk; // 导入包

public class MainActivity extends ReactActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        GetuiSdk.startWithAppId(this, "zZ6aAw5JuE6LMn3OvTrW43", "xj6TBQAoMb5BMPWgJLv4M", "Uc9FVcLuIh93CG8vkXsWn1");
    }
    // ...
}