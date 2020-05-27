import { postHandler, BodyParsingIncomingMessage } from '../../../api/serviceMessages/postHandler'
import { Criticality, ServiceMessage } from '../../../../lib/collections/CoreSystem'
import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'
import * as serviceMessagesApi from '../../../api/serviceMessages/serviceMessagesApi'

jest.mock('../../../api/serviceMessages/serviceMessagesApi', () => {
	return {
		__esModule: true,
		writeMessage: jest.fn(() => ({ systemError: false })),
	}
})

const validInput: ServiceMessage = {
	id: '294a7079efdce49fb553e52d9e352e24',
	criticality: Criticality.CRITICAL,
	message: 'Something is wrong that should have been right',
	sender: 'ola',
	timestamp: new Date(),
}

declare global {
	namespace jest {
		interface Matchers<R> {
			toBeHttpOkStatusCode(): R
		}
	}
}

expect.extend({
	toBeHttpOkStatusCode(value) {
		const allowed = [200, 201, 204]
		if (allowed.indexOf(value) > -1) {
			return {
				message: `expected ${value} to not be one of ${allowed.join(',')}`,
				pass: true,
			}
		}

		return {
			message: `expected ${value} to be one of ${allowed.join(',')}`,
			pass: false,
		}
	},
})

describe('ServiceMessages API POST endpoint', () => {
	let mockRequest: BodyParsingIncomingMessage
	let mockResponse: ServerResponse
	let mockResponseEnd: jest.Mock<Function>
	const mockedWriteMessage: jest.Mock<typeof serviceMessagesApi.writeMessage> = serviceMessagesApi.writeMessage as any

	beforeEach(() => {
		mockRequest = new IncomingMessage(new Socket())
		mockResponse = new ServerResponse(mockRequest)
		mockResponseEnd = jest.fn()
		Object.defineProperty(mockResponse, 'end', { value: mockResponseEnd })
	})

	describe('input validation', () => {
		it('should accept valid input', () => {
			mockRequest.body = JSON.parse(JSON.stringify(validInput))

			postHandler({}, mockRequest, mockResponse)

			expect(mockResponse.statusCode).toBeHttpOkStatusCode()
			expect(mockResponseEnd).toHaveBeenCalledTimes(1)
		})

		describe('id field', () => {
			// id: string
			it('should reject when value is missing', () => {
				const invalidInput = { ...validInput }
				delete invalidInput.id
				mockRequest.body = JSON.parse(JSON.stringify(invalidInput))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toEqual(400)
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})

			it('should reject empty string', () => {
				const invalidInput = { ...validInput }
				invalidInput.id = ''
				mockRequest.body = JSON.parse(JSON.stringify(invalidInput))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toEqual(400)
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})

			it('should reject blank string', () => {
				const invalidInput = { ...validInput }
				invalidInput.id = ' \t'
				mockRequest.body = JSON.parse(JSON.stringify(invalidInput))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toEqual(400)
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})
		})

		describe('criticality field', () => {
			// criticality: Criticality
			it('should reject when value is missing', () => {
				const invalidInput = { ...validInput }
				delete invalidInput.criticality
				mockRequest.body = JSON.parse(JSON.stringify(invalidInput))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toEqual(400)
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})

			it('should reject non numeric value', () => {
				const invalidInput: any = { ...validInput }
				invalidInput.criticality = 'lol'
				mockRequest.body = JSON.parse(JSON.stringify(invalidInput))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toEqual(400)
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})

			it('should reject negative number', () => {
				const invalidInput: any = { ...validInput }
				invalidInput.criticality = -1
				mockRequest.body = JSON.parse(JSON.stringify(invalidInput))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toEqual(400)
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})

			it('should reject non-criticality positive number', () => {
				const tooHigh =
					Object.values(Criticality)
						.filter((value) => !isNaN(value))
						.sort((a, b) => b - a)[0] + 1
				const invalidInput: any = { ...validInput }
				invalidInput.criticality = tooHigh
				mockRequest.body = JSON.parse(JSON.stringify(invalidInput))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toEqual(400)
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})

			it('should accept a valid value as a string', () => {
				const alsoValid: any = { ...validInput }
				alsoValid.criticality = `${validInput.criticality}`
				mockRequest.body = JSON.parse(JSON.stringify(alsoValid))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toBeHttpOkStatusCode()
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})

			it('should reject empty string value', () => {
				const invalidInput: any = { ...validInput }
				invalidInput.criticality = ''
				mockRequest.body = JSON.parse(JSON.stringify(invalidInput))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toEqual(400)
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})
		})

		describe('message field', () => {
			// message: string
			it('should reject when value is missing', () => {
				const invalidInput = { ...validInput }
				delete invalidInput.message
				mockRequest.body = JSON.parse(JSON.stringify(invalidInput))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toEqual(400)
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})

			it('should reject empty string', () => {
				const invalidInput = { ...validInput }
				invalidInput.message = ''
				mockRequest.body = JSON.parse(JSON.stringify(invalidInput))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toEqual(400)
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})

			it('should reject blank string', () => {
				const invalidInput = { ...validInput }
				invalidInput.message = ' \t'
				mockRequest.body = JSON.parse(JSON.stringify(invalidInput))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toEqual(400)
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})
		})

		describe('sender field', () => {
			// sender?: string
			it('should accept missing value', () => {
				const alsoValid = { ...validInput }
				delete alsoValid.sender
				mockRequest.body = JSON.parse(JSON.stringify(alsoValid))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toBeHttpOkStatusCode()
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})

			it('should accept empty value', () => {
				const alsoValid = { ...validInput }
				alsoValid.sender = ''
				mockRequest.body = JSON.parse(JSON.stringify(alsoValid))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toBeHttpOkStatusCode()
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})
		})

		describe('timestamp field', () => {
			// timestamp: Date
			it('should reject when value is missing', () => {
				const invalidInput = { ...validInput }
				delete invalidInput.timestamp
				mockRequest.body = JSON.parse(JSON.stringify(invalidInput))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toEqual(400)
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})

			it('should reject non date value', () => {
				const invalidInput = { ...validInput } as any
				invalidInput.timestamp = 'this is not a date'
				mockRequest.body = JSON.parse(JSON.stringify(invalidInput))

				postHandler({}, mockRequest, mockResponse)

				expect(mockResponse.statusCode).toEqual(400)
				expect(mockResponseEnd).toHaveBeenCalledTimes(1)
			})
		})
	})

	describe('data storage', () => {
		it('should call API writeMessage with the given id', () => {
			const expected = validInput.id
			mockRequest.body = JSON.parse(JSON.stringify(validInput))

			postHandler({}, mockRequest, mockResponse)

			expect(mockedWriteMessage.mock.calls[0][0]).toHaveProperty('id', expected)
		})

		it('should call API writeMessage with the given criticality', () => {
			const expected = Number(validInput.criticality)
			mockRequest.body = JSON.parse(JSON.stringify(validInput))

			postHandler({}, mockRequest, mockResponse)

			expect(mockedWriteMessage.mock.calls[0][0]).toHaveProperty('criticality', expected)
		})

		it('should call API writeMessage with the given criticality when criticality is a string', () => {
			const expected = Number(validInput.criticality)
			const alsoValid: any = { ...validInput }
			alsoValid.criticality = `${validInput.criticality}`
			mockRequest.body = JSON.parse(JSON.stringify(alsoValid))

			postHandler({}, mockRequest, mockResponse)

			expect(mockedWriteMessage.mock.calls[0][0]).toHaveProperty('criticality', expected)
		})

		it('should call API writeMessage with the given message', () => {
			const expected = validInput.message
			mockRequest.body = JSON.parse(JSON.stringify(validInput))

			postHandler({}, mockRequest, mockResponse)

			expect(mockedWriteMessage.mock.calls[0][0]).toHaveProperty('message', expected)
		})
		it('should call API writeMessage with the given sender', () => {
			const expected = validInput.sender
			mockRequest.body = JSON.parse(JSON.stringify(validInput))

			postHandler({}, mockRequest, mockResponse)

			expect(mockedWriteMessage.mock.calls[0][0]).toHaveProperty('sender', expected)
		})

		it('should call API writeMessage with the given timestamp', () => {
			const expected = new Date(validInput.timestamp)
			mockRequest.body = JSON.parse(JSON.stringify(validInput))

			postHandler({}, mockRequest, mockResponse)

			expect(mockedWriteMessage.mock.calls[0][0]).toHaveProperty('timestamp', expected)
		})
	})

	describe('http response', () => {
		it('should reply 201 Created for new messages', () => {
			const spy = jest.spyOn(serviceMessagesApi, 'writeMessage').mockImplementation(() => ({
				isUpdate: false,
			}))
			mockRequest.body = JSON.parse(JSON.stringify(validInput))

			postHandler({}, mockRequest, mockResponse)

			expect(mockResponse.statusCode).toBe(201)
			spy.mockRestore()
		})

		it('should put the new message in the response body', () => {
			const spy = jest.spyOn(serviceMessagesApi, 'writeMessage').mockImplementation(() => ({
				isUpdate: false,
			}))
			mockRequest.body = JSON.parse(JSON.stringify(validInput))

			postHandler({}, mockRequest, mockResponse)
			const writtenMessage = mockedWriteMessage.mock.calls[0][0]
			const expected = JSON.stringify(writtenMessage)

			/* this isn't really perfect, as it would be perfectly fine for the
			 * implementing unit to write the body with response#write.
			 * But, I'm not implementing a full mock of ServerResponse at this stage :S
			 */
			expect(mockResponseEnd).toHaveBeenCalledWith(expected)
			spy.mockRestore()
		})

		it('should reply 200 OK for updated messages', () => {
			const spy = jest.spyOn(serviceMessagesApi, 'writeMessage').mockImplementation(() => ({
				isUpdate: true,
			}))
			mockRequest.body = JSON.parse(JSON.stringify(validInput))

			postHandler({}, mockRequest, mockResponse)

			expect(mockResponse.statusCode).toBe(200)
			spy.mockRestore()
		})
		it('should put the updated message in the response body', () => {
			const spy = jest.spyOn(serviceMessagesApi, 'writeMessage').mockImplementation(() => ({
				isUpdate: true,
			}))
			mockRequest.body = JSON.parse(JSON.stringify(validInput))

			postHandler({}, mockRequest, mockResponse)
			const writtenMessage = mockedWriteMessage.mock.calls[0][0]
			const expected = JSON.stringify(writtenMessage)

			/* this isn't really perfect, as it would be perfectly fine for the
			 * implementing unit to write the body with response#write.
			 * But, I'm not implementing a full mock of ServerResponse at this stage :S
			 */
			// expect(mockResponseEnd.mock.calls[0][0]).toEqual(expected)
			expect(mockResponseEnd).toHaveBeenCalledWith(expected)
			spy.mockRestore()
		})

		it('should reply 500 when message cant be stored', () => {
			const spy = jest.spyOn(serviceMessagesApi, 'writeMessage').mockImplementation(() => {
				throw new Error('lol')
			})
			mockRequest.body = JSON.parse(JSON.stringify(validInput))

			postHandler({}, mockRequest, mockResponse)

			expect(mockResponse.statusCode).toBe(500)
			spy.mockRestore()
		})
	})
})
