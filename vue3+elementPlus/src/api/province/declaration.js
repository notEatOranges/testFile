import request from '../index'

export const getDeclarationList = (params) => {
  return request({
    url: '/province/declaration/list',
    method: 'get',
    params
  })
}

export const getDeclarationDetail = (id) => {
  return request({
    url: `/province/declaration/${id}`,
    method: 'get'
  })
}

export const createDeclaration = (data) => {
  return request({
    url: '/province/declaration',
    method: 'post',
    data
  })
}

export const updateDeclaration = (id, data) => {
  return request({
    url: `/province/declaration/${id}`,
    method: 'put',
    data
  })
}

export const deleteDeclaration = (id) => {
  return request({
    url: `/province/declaration/${id}`,
    method: 'delete'
  })
}

export const withdrawDeclaration = (id) => {
  return request({
    url: `/province/declaration/${id}/withdraw`,
    method: 'post'
  })
}
