<template>
  <div class="register-container">
    <div class="register-form">
      <h2 class="title">用户注册</h2>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        status-icon
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名"
            @blur="checkUsernameAvailable"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
            <el-radio label="保密">保密</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            class="submit-btn"
            :loading="loading"
            @click="submitForm"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="form-footer">
        <span>已有账号？</span>
        <a href="javascript:void(0)" @click="navigateTo('/login')">立即登录</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register, checkUsername } from '../api/user'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const usernameAvailable = ref(true)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  gender: '保密'
})

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else {
    if (form.confirmPassword !== '') {
      formRef.value.validateField('confirmPassword')
    }
    callback()
  }
}

const validateConfirmPass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const validateUsername = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入用户名'))
  } else if (!usernameAvailable.value) {
    callback(new Error('该用户名已被占用'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { validator: validateUsername, trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3到20个字符之间', trigger: 'blur' }
  ],
  password: [
    { validator: validatePass, trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在6到20个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPass, trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ]
}

const checkUsernameAvailable = async () => {
  if (form.username && form.username.length >= 3) {
    try {
      console.log('开始检查用户名:', form.username)
      const res = await checkUsername(form.username)
      console.log('检查用户名响应:', res)
      usernameAvailable.value = res.data
      
      if (!usernameAvailable.value) {
        ElMessage.warning('该用户名已被占用')
      }
      
      // 手动触发验证
      formRef.value?.validateField('username')
    } catch (error) {
      console.error('检查用户名失败:', error)
      // 显示具体错误信息
      ElMessage.error(error.message || '检查用户名失败')
    }
  }
}

// 通用导航函数
const navigateTo = (path, query = {}) => {
  console.log(`导航到: ${path}`, query)
  
  router.push({ path, query }).catch(err => {
    if (err.name !== 'NavigationDuplicated') {
      console.error('导航错误:', err)
      // 使用window.location作为备用
      const queryString = Object.keys(query).length > 0 
        ? '?' + new URLSearchParams(query).toString() 
        : ''
      window.location.href = path + queryString
    }
  })
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        
        // 调用注册接口
        const res = await register({
          username: form.username,
          password: form.password,
          gender: form.gender
        })
        
        ElMessage({
          type: 'success',
          message: '注册成功，请登录'
        })
        
        // 跳转到登录页
        navigateTo('/login')
      } catch (error) {
        console.error('注册失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px);
  background-color: #f5f5f5;
  padding: 40px 0;
}

.register-form {
  width: 400px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.submit-btn {
  width: 100%;
}

.form-footer {
  margin-top: 20px;
  text-align: center;
  color: #666;
}

.form-footer a {
  color: #409EFF;
  text-decoration: none;
  margin-left: 5px;
}
</style> 