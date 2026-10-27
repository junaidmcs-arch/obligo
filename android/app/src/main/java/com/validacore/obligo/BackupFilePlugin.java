package com.validacore.obligo;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Save through Android's document picker, without broad storage permissions. */
@CapacitorPlugin(name = "BackupFile")
public class BackupFilePlugin extends Plugin {
    private String pendingContents;

    @PluginMethod
    public void saveFile(PluginCall call) {
        if (pendingContents != null) {
            call.reject("A save is already in progress.");
            return;
        }
        String filename = call.getString("filename");
        String contents = call.getString("contents");
        if (filename == null || !filename.matches("obligo-backup-[A-Za-z0-9-]+\\.json") ||
            contents == null || contents.getBytes(StandardCharsets.UTF_8).length > 10 * 1024 * 1024) {
            call.reject("Invalid backup file.");
            return;
        }
        // Do not put the backup payload in Android's size-limited saved-state Bundle.
        pendingContents = contents;
        call.getData().remove("contents");
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, filename);
        try {
            startActivityForResult(call, intent, "saveResult");
        } catch (RuntimeException error) {
            pendingContents = null;
            call.reject("Could not open the file picker. Try again.");
        }
    }

    @ActivityCallback
    private void saveResult(PluginCall call, ActivityResult result) {
        String contents = pendingContents;
        pendingContents = null;
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK) {
            call.resolve(new JSObject().put("cancelled", true));
            return;
        }
        Intent intent = result.getData();
        Uri uri = intent == null ? null : intent.getData();
        if (uri == null || contents == null) {
            call.reject("Backup was not saved. Prepare it again and retry.");
            return;
        }
        getBridge().execute(() -> {
            try (OutputStream stream = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                if (stream == null) throw new java.io.IOException("No output stream");
                stream.write(contents.getBytes(StandardCharsets.UTF_8));
                stream.flush();
            } catch (Exception error) {
                call.reject("Could not save the backup. Check available space and try a new file.");
                return;
            }
            call.resolve(new JSObject().put("cancelled", false));
        });
    }
}
