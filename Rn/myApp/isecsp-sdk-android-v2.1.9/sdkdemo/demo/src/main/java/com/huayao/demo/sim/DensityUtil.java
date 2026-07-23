package com.huayao.demo.sim;

import android.app.Activity;
import android.content.Context;
import android.util.DisplayMetrics;

public class DensityUtil {

    private static DisplayMetrics mDms = new DisplayMetrics();

    /**
     * 获取屏幕高度
     *
     * @param context Activity
     * @return int
     */
    public static int getScreenHeight(Context context) {
        int screenHeight = context.getResources().getDisplayMetrics().heightPixels;
        if (context instanceof Activity) {
            ((Activity) context).getWindowManager().getDefaultDisplay().getMetrics(mDms);
            screenHeight = mDms.heightPixels;
        }
        return screenHeight;
    }

    /**
     * 获取屏幕宽度
     *
     * @param context Activity
     * @return int
     */
    public static int getScreenWidth(Context context) {
        int width = context.getResources().getDisplayMetrics().widthPixels;
        if (context instanceof Activity) {
            ((Activity) context).getWindowManager().getDefaultDisplay().getMetrics(mDms);
            width = mDms.widthPixels;
        }
        return width;
    }

    public static int getStatusBarHeight(Context context) {
        int resourceId = context.getApplicationContext().getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (resourceId > 0) {
            //根据资源ID获取响应的尺寸值
            return context.getApplicationContext().getResources().getDimensionPixelSize(resourceId);
        }
        return 0;
    }

    /**
     * 根据手机的分辨率从 dp 的单位 转成为 px(像素)
     */
    public static int dip2px(Context context, float dpValue) {
        final float scale = context.getApplicationContext().getResources().getDisplayMetrics().density;
        return (int) (dpValue * scale + 0.5f);
    }

}
