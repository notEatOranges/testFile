package com.huayao.demo.sim;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import com.huayao.demo.R;

import java.util.ArrayList;
import java.util.List;

public class SimInfoListAdapter extends BaseAdapter {

    private List<String> list = new ArrayList<>();
    private Context context;

    public SimInfoListAdapter(List<String> list, Context context) {
        if (list != null) this.list = list;
        this.context = context;
    }

    @Override
    public int getCount() {
        return list.size();
    }

    @Override
    public Object getItem(int position) {
        return list.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        View view = LayoutInflater.from(context).inflate(R.layout.sim_list_info_item_layout,null);
        TextView tv = view.findViewById(R.id.sim_item_tv);
        tv.setText(list.get(position));
        return view;
    }

    public void setNewData(List<String> list){
        if (list != null) this.list = list;
    }
}
