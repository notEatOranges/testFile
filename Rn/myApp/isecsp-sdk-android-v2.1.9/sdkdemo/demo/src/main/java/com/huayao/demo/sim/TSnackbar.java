package com.huayao.demo.sim;

import android.app.Activity;
import android.os.Handler;
import android.os.Message;
import android.support.v4.view.animation.FastOutSlowInInterpolator;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.FrameLayout;
import android.widget.TextView;

import com.huayao.demo.R;

import java.lang.ref.WeakReference;

public class TSnackbar {

    public static final int LENGTH_SHORT = -1;
    /**
     * Show the TSnackbar for a long period of time.
     */
    public static final int LENGTH_LONG = 0;

    private int residenceTime = 0;
    private View view;
    private static WeakReference<View> oldView;
    private String message;
    private int stateBarHeight, actionBarHeight;
    private Handler handler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            switch (msg.what) {
                case 1:
                    animateViewOut();
                    break;
            }
        }
    };


    public static TSnackbar make(View view, String message, int time) {
        TSnackbar tSnackbar2 = new TSnackbar();
        tSnackbar2.setDuration(time);
        tSnackbar2.setMessage(message);
        tSnackbar2.setView(view);
        return tSnackbar2;
    }

    public void show() {
        animateViewIn();
    }

    public void setMinHeight(int stateBarHeight, int actionBarHeight) {
        ViewGroup.LayoutParams params = view.getLayoutParams();
        params.height = stateBarHeight + actionBarHeight;
        view.setLayoutParams(params);
        this.stateBarHeight = stateBarHeight;
        this.actionBarHeight = actionBarHeight;
    }

    public void setView(View view) {
        if (oldView != null && oldView.get() != null) {
            View old = oldView.get();
            if (old.getParent() != null) {
                handler.removeMessages(1);
                ((ViewGroup) old.getParent()).removeView(old);
            }
        }
        ViewGroup viewGroup = findSuitableParent(view);
        if (viewGroup != null) {
            this.view = LayoutInflater.from(view.getContext()).inflate(R.layout.top_dialog_layout, null);
            viewGroup.addView(this.view, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, stateBarHeight + actionBarHeight));
            TextView textView = this.view.findViewById(R.id.txtToastMessage);
            if (textView != null) {
                textView.setText(message);
            }
            oldView = new WeakReference<View>(this.view);
        }
    }

    private void setMessage(String message) {
        this.message = message;
    }

    public void setDuration(int time) {
        if (time >= 0) {
            residenceTime = 5000;
        } else {
            residenceTime = 2000;
        }
    }

    private static ViewGroup findSuitableParent(View view) {
        ViewGroup fallback = null;
        do {
            if (view instanceof FrameLayout) {
                if (view.getId() == android.R.id.content) {
                    return (ViewGroup) view;
                } else {
                    fallback = (ViewGroup) view;
                }
            }
            if (view != null) {
                final ViewParent parent = view.getParent();
                view = parent instanceof View ? (View) parent : null;
            }
        } while (view != null);
        return fallback;
    }

    private void animateViewIn() {
        if (view == null) {
            return;
        }
        Animation anim = getAnimationInFromTopToDown();
        anim.setInterpolator(new FastOutSlowInInterpolator());
        anim.setDuration(250);
        anim.setAnimationListener(new Animation.AnimationListener() {
            @Override
            public void onAnimationEnd(Animation animation) {
                handler.sendEmptyMessageDelayed(1, residenceTime);
            }

            @Override
            public void onAnimationStart(Animation animation) {
            }

            @Override
            public void onAnimationRepeat(Animation animation) {
            }
        });
        view.startAnimation(anim);
    }

    private void animateViewOut() {
        if (view == null) {
            return;
        }
        Animation anim = getAnimationOutFromTopToDown();

        anim.setInterpolator(new FastOutSlowInInterpolator());
        anim.setDuration(250);
        anim.setAnimationListener(new Animation.AnimationListener() {
            @Override
            public void onAnimationEnd(Animation animation) {
                if (view != null && view.getParent() != null) {
                    ((ViewGroup) view.getParent()).removeView(view);
                }
            }

            @Override
            public void onAnimationStart(Animation animation) {
            }

            @Override
            public void onAnimationRepeat(Animation animation) {
            }
        });
        view.startAnimation(anim);
    }

    private Animation getAnimationInFromTopToDown() {
        return AnimationUtils.loadAnimation(view.getContext(), R.anim.top_in);
    }

    private Animation getAnimationOutFromTopToDown() {
        return AnimationUtils.loadAnimation(view.getContext(), R.anim.top_out);
    }

    public static void showTSnack(String message,Activity activity) {
        final ViewGroup viewGroup = (ViewGroup) activity.findViewById(android.R.id.content).getRootView();
        TSnackbar snackbar = make(viewGroup, message, TSnackbar.LENGTH_SHORT);
        //snackbar.setMinHeight(DensityUtil.getStatusBarHeight(activity), DensityUtil.dip2px(activity, 45));
        snackbar.setMinHeight(0, DensityUtil.dip2px(activity, 35));
        snackbar.show();
    }

}