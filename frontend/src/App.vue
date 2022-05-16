<template>
  <el-config-provider :locale="locale">
    <div class="content-wrapper">
      <div class="select-wrapper">
        <el-select v-model="selectedEnvFile" placeholder="请选择一份环境变量" style="flex: 1">
          <el-option v-for="file in fileLlist" :key="file.id" :label="file.name || '默认(.env)'" :value="file.id" />
        </el-select>
        <el-input v-model="fileName" placeholder="请输入文件名" style="width: 340px; margin-left: 15px">
          <template #prepend>
            <span class="cutomer-prepend">.env.</span>
          </template>
          <template #append>
            <el-button type="primary" class="customer" :disabled="envData.some((it) => it.isEdit) || !fileName" @click="create"
              >点击添加文件</el-button
            >
          </template>
        </el-input>
        <el-dropdown trigger="click" :disabled="!selectedEnvFile">
          <el-button type="danger" style="margin-left: 5px">更多</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="removeFile">删除当前文件</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div class="table-wrapper">
        <div class="total-wrapper">
          <div style="flex: 1">共有 {{ total }} 条数据，已选中 {{ multipleSelection.length }} 个</div>
          <el-button
            @click="batchRemove"
            type="text"
            style="color: var(--vscode-inputValidation-errorBorder)"
            :disabled="!multipleSelection.length"
            >批量删除</el-button
          >
        </div>
        <el-table
          :data="envData"
          style="width: 100%"
          @filter-change="(filters: any) => filteredValue = filters.type || []"
          @selection-change="(val) => (multipleSelection = val)"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column type="index" width="40" />
          <el-table-column
            width="100"
            type="type"
            label="类型"
            column-key="type"
            :filters="[
              { text: '变量', value: 'variable' },
              { text: '注释', value: 'annotation' },
              { text: '文本', value: 'text' },
              { text: '空白行', value: 'blank' },
            ]"
            :filtered-value="filteredValue"
            :filter-method="(value, row) => row.type === value"
          >
            <template #default="scope">
              <el-tag v-if="scope.row.type === 'annotation'" type="info">注释</el-tag>
              <el-tag v-if="scope.row.type === 'text'" type="danger">文本</el-tag>
              <el-tag v-if="scope.row.type === 'variable'" type="success">变量</el-tag>
              <el-tag v-if="scope.row.type === 'blank'" type="warning">空白行</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="key" label="KEY" show-overflow-tooltip>
            <template #default="scope">
              <el-input v-if="scope.row.isEdit" v-model="scope.row.cacheKey" placeholder="请输入KEY值"></el-input>
              <template v-else>{{ scope.row.key }}</template>
            </template>
          </el-table-column>
          <el-table-column prop="value" label="VALUE" show-overflow-tooltip>
            <template #default="scope">
              <el-input v-if="scope.row.isEdit" v-model="scope.row.cacheValue" placeholder="请输入VALUE值"></el-input>
              <template v-else>{{ scope.row.value }}</template>
            </template>
          </el-table-column>
          <el-table-column
            prop="content"
            label="内容"
            show-overflow-tooltip
            v-if="filteredValue && filteredValue.some((it) => ['annotation', 'text'].includes(it))"
          >
            <template #default="scope">
              <template v-if="scope.row.type === 'variable'"> {{ scope.row.key }}={{ scope.row.value }} </template>
              <template v-else>{{ scope.row.content }}</template>
            </template>
          </el-table-column>
          <el-table-column prop="line" label="所在行" width="70" />

          <el-table-column prop="operate" label="操作" width="120">
            <template #default="scope">
              <template v-if="scope.row.type === 'variable'">
                <template v-if="scope.row.isEdit">
                  <el-button type="text" @click="save(scope.row)">保存</el-button>
                  <el-divider direction="vertical" />
                  <el-button type="text" @click="cancel(scope.row)">取消</el-button>
                </template>

                <template v-else>
                  <el-button type="text" @click="edit(scope.row)" :disabled="envData.some((it) => it.isEdit)">编辑</el-button>
                  <el-divider direction="vertical" />
                  <el-popconfirm title="确定要删除该条数据吗?" @confirm="remove(scope.row.line)">
                    <template #reference>
                      <el-button type="text" style="color: var(--vscode-inputValidation-errorBorder)">删除</el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </template>

              <template v-else>
                <el-popconfirm title="确定要删除吗?" @confirm="remove(scope.row.line)">
                  <template #reference>
                    <el-button type="text" style="color: var(--vscode-inputValidation-errorBorder)">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </template>
          </el-table-column>
        </el-table>
        <el-button style="width: 100%; margin: 15px 0" @click="add" :disabled="envData.some((it) => it.isEdit) || !selectedEnvFile"
          >添加新的环境变量</el-button
        >
      </div>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  ElConfigProvider,
  ElButton,
  ElPopconfirm,
  ElSelect,
  ElOption,
  ElInput,
  ElTable,
  ElTableColumn,
  ElDivider,
  ElTag,
  ElDropdown,
  ElDropdownItem,
} from "element-plus";
import zhCn from "element-plus/lib/locale/lang/zh-cn";

const vscode = (window as any)?.acquireVsCodeApi
  ? // @ts-ignore
    acquireVsCodeApi()
  : {
      postMessage: window.console.log,
    };

const locale = zhCn;
const filteredValue = ref(["variable"]);
const selectedEnvFile = ref<string>("");
const multipleSelection = ref<any[]>([]);
const fileName = ref("");
const fileLlist = ref<{ id: string; name: string; schema: any[]; path: string }[]>([]);

const envData = computed(() => {
  const selectedFileData = fileLlist.value.find((it) => it.id === selectedEnvFile.value);
  return selectedFileData?.schema || [];
});

const total = computed(() => {
  const target = envData.value.filter((it) => {
    return filteredValue.value.includes(it.type);
  });
  return target ? target.length : 0;
});

const trim = (str: string) => str.replace(/(^\s*)|(\s*$)/g, "");
const editingId = ref("");
const edit = (row: any) => {
  row.cacheKey = row.key;
  row.cacheValue = row.value;
  row.isEdit = true;
  editingId.value = row.id;
};
const remove = (line: number) => {
  const selectedFileData = fileLlist.value.find((it) => it.id === selectedEnvFile.value);
  vscode.postMessage({
    command: "REMOVE_SCHEMA",
    data: {
      fileId: selectedFileData?.id,
      line,
    },
  });
};

const batchRemove = () => {
  const selectedFileData = fileLlist.value.find((it) => it.id === selectedEnvFile.value);

  vscode.postMessage({
    command: "BATCH_REMOVE_SCHEMA",
    data: {
      fileId: selectedFileData?.id,
      ids: multipleSelection.value.map((it) => it.id),
    },
  });
};

const add = () => {
  vscode.postMessage({
    command: "ADD_SCHEMA",
    data: {
      fileId: selectedEnvFile.value,
    },
  });
};

const cancel = (row: any) => {
  const { value, key } = row;
  Object.assign(row, {
    cacheKey: trim(key),
    cacheValue: trim(value),
    isEdit: false,
  });
};

const save = (row: any) => {
  const { cacheKey, cacheValue } = row;
  const targetKey = trim(cacheKey);
  const targetValue = trim(cacheValue);

  if (!targetKey || !targetValue) {
    vscode.postMessage({ command: "ERROR_MESSAGE", data: "KEY 或者 VALUE 不能为空" });
    return;
  } else {
    if (/^#/.test(targetKey)) {
      vscode.postMessage({ command: "ERROR_MESSAGE", data: "KEY 不能以 # 开头" });
      return;
    }

    Object.assign(row, {
      key: cacheKey,
      value: cacheValue,
      isEdit: false,
      content: cacheKey + "=" + cacheValue,
    });

    const { id, key, value, type, line, content } = row;
    vscode.postMessage({
      command: "SAVE_VARIABLE",
      data: {
        fileId: selectedEnvFile.value,
        fileLine: line,
        schemaData: { id, key, value, type, line, content },
      },
    });
  }
};

const create = () => {
  if (fileName.value) {
    vscode.postMessage({ command: "CREATE_ENV_FILE", data: fileName.value });
    fileName.value = "";
  }
};

const removeFile = () => {
  vscode.postMessage({ command: "REMOVE_ENV_FILE", data: selectedEnvFile.value });
  selectedEnvFile.value = "";
};

vscode.postMessage({ command: "GET_FILE_list" });

window.addEventListener("message", (event) => {
  console.log("收到来自vscode的推送消息");
  const { command, data, active } = event.data;
  if (command === "SET_FILE_list") {
    fileLlist.value = JSON.parse(data);
    // 设置默认选中
    console.log(data);
    selectedEnvFile.value = active ? active : fileLlist?.value[0]?.id;
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.content-wrapper {
  width: 90%;
  min-width: 600px;
  margin: 0 auto;
  max-width: 1100px;
}
.select-wrapper {
  margin-bottom: 20px;
  display: flex;
}
.el-table tr th {
  border-top: var(--el-table-border);
}
.total-wrapper {
  text-align: left;
  font-size: 13px;
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}
</style>
