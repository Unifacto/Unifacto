﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;
using Microsoft.AspNetCore.Authorization;
using CaseSite.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using System.IO.Compression;
using System.IO;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace CaseSite.Controllers
{
    [Route("api/blob")]
    public class BlobController : Controller
    {
        CloudBlobClient blobClient;
        private readonly UnifactoContext _context;
        private readonly UserManager<IdentityUser> _userManager;

        public BlobController(UnifactoContext context, UserManager<IdentityUser> userManager)
        {
            _context = context;
            _userManager = userManager;
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse("DefaultEndpointsProtocol=https;AccountName=unifacto;AccountKey=Gj0ZZxfVI1+0hfhlf8tnQxnBHGx0WOFZ8i/rGbtTvyyStQrij1rnyt1ujiqpQWHct8slY/GoEPWOQwBkglFy4Q==;EndpointSuffix=core.windows.net");
            blobClient = storageAccount.CreateCloudBlobClient();
        }

        // POST api/values
        [HttpPost("uploadLogo/{id}")]
        public async Task<IActionResult> Post([FromRoute] int id)
        {

            var business = await _context.Business.SingleOrDefaultAsync(b => b.Id == id);

            if (business == null)
            {
                return NotFound(new { businessError = "Business not found" });
            }

            var httpRequest = HttpContext.Request;
            if (httpRequest.Form.Files.Count > 0)
            {
                var file = httpRequest.Form.Files[0];
                CloudBlobContainer container = blobClient.GetContainerReference("unifactoblobcontainer");
                await container.CreateIfNotExistsAsync();
                CloudBlobDirectory logoDirectory = container.GetDirectoryReference("businesses").GetDirectoryReference(business.Id.ToString()).GetDirectoryReference("logo");

                var blobs = (await logoDirectory.ListBlobsSegmentedAsync(true, BlobListingDetails.None, 500, null, null, null)).Results;

                foreach (var blob in blobs)
                {
                    await ((CloudBlob)blob).DeleteIfExistsAsync();
                }

                CloudBlockBlob blockBlob = container.GetBlockBlobReference(@"businesses/" + business.Id + @"/logo/" + file.FileName);
                await blockBlob.UploadFromStreamAsync(file.OpenReadStream());
                business.LogoUrl = blockBlob.Uri.ToString();
                _context.Entry(business).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return Ok(business.LogoUrl);
            }
            return NotFound();
        }

        [HttpPost("uploadattachments/{taskId}")]
        public async Task<IActionResult> PostAttachment([FromRoute] int taskId)
        {
            var task = await _context.Task.SingleOrDefaultAsync(t => t.Id == taskId);
            if (task == null)
            {
                return NotFound(new { taskError = "Task not found" });
            }

            var business = await _context.Business.SingleOrDefaultAsync(b => b.Id == task.BusinessId);
            if (business == null)
            {
                return NotFound(new { businessError = "Business not found" });
            }

            var httpRequest = HttpContext.Request;
            if (httpRequest.Form.Files.Count > 0)
            {
                foreach (var file in httpRequest.Form.Files)
                {
                    CloudBlobContainer container = blobClient.GetContainerReference("unifactoblobcontainer");
                    await container.CreateIfNotExistsAsync();
                    CloudBlobDirectory taskFilesDirectory = container.GetDirectoryReference("businesses").GetDirectoryReference(business.Id.ToString()).GetDirectoryReference("tasks").GetDirectoryReference(task.Id.ToString()).GetDirectoryReference("taskfiles");

                    CloudBlockBlob blockBlob = container.GetBlockBlobReference(@"businesses/" + business.Id + @"/tasks/" + task.Id + @"/taskfiles/" + file.FileName);
                    await blockBlob.UploadFromStreamAsync(file.OpenReadStream());

                }
                return Ok();
            }

            return NotFound();
        }

        //Denne er post da angular 2 ikek har support til at kunne sende fileName med i body
        [HttpPost("deleteattachment")]
        public async Task<IActionResult> DeleteAttachment([FromBody] JObject obj)
        {
            int taskId = (int)obj["taskId"];
            string fileName = (string)obj["fileName"];

            var task = await _context.Task.SingleOrDefaultAsync(t => t.Id == taskId);
            if (task == null)
            {
                return NotFound(new { taskError = "Task not found" });
            }

            var business = await _context.Business.SingleOrDefaultAsync(b => b.Id == task.BusinessId);
            if (business == null)
            {
                return NotFound(new { businessError = "Business not found" });
            }

            CloudBlobContainer container = blobClient.GetContainerReference("unifactoblobcontainer");
            await container.CreateIfNotExistsAsync();
            CloudBlobDirectory taskFilesDirectory = container.GetDirectoryReference("businesses").GetDirectoryReference(business.Id.ToString()).GetDirectoryReference("tasks").GetDirectoryReference(task.Id.ToString()).GetDirectoryReference("taskfiles");

            CloudBlockBlob blobToDelete = taskFilesDirectory.GetBlockBlobReference(fileName);
            if (blobToDelete == null)
            {
                return NotFound(new { fileError = "File not found" });
            }
            await blobToDelete.DeleteAsync();
            return Ok();
        }

        [HttpGet("getattachments/{taskId}")]
        public async Task<IActionResult> GetAttachment([FromRoute] int taskId)
        {
            var task = await _context.Task.SingleOrDefaultAsync(t => t.Id == taskId);
            if(task == null)
            {
                return NotFound(new { taskError = "Task not found" });
            }

            var business = await _context.Business.SingleOrDefaultAsync(b => b.Id == task.BusinessId);
            if(business == null)
            {
                return NotFound(new { businessError = "Busineess not found" });
            }
            CloudBlobContainer container = blobClient.GetContainerReference("unifactoblobcontainer");
            CloudBlobDirectory taskFilesDirectory = container.GetDirectoryReference("businesses").GetDirectoryReference(business.Id.ToString()).GetDirectoryReference("tasks").GetDirectoryReference(task.Id.ToString()).GetDirectoryReference("taskfiles");
            var blobs = (await taskFilesDirectory.ListBlobsSegmentedAsync(true, BlobListingDetails.All, 500, null, null, null)).Results;
    
            if (blobs == null)
            {
                return NotFound(new { fileError = "File(s) not found" });
            }

            return Ok(blobs);
        }

        [HttpGet("getattachmentnames/{taskId}")]
        public async Task<IActionResult> GetAttachmentNames([FromRoute] int taskId)
        {
            var task = await _context.Task.SingleOrDefaultAsync(t => t.Id == taskId);
            if (task == null)
            {
                return NotFound(new { taskError = "Task not found" });
            }

            var business = await _context.Business.SingleOrDefaultAsync(b => b.Id == task.BusinessId);
            if (business == null)
            {
                return NotFound(new { businessError = "Busineess not found" });
            }

            CloudBlobContainer container = blobClient.GetContainerReference("unifactoblobcontainer");
            CloudBlobDirectory taskFilesDirectory = container.GetDirectoryReference("businesses").GetDirectoryReference(business.Id.ToString()).GetDirectoryReference("tasks").GetDirectoryReference(task.Id.ToString()).GetDirectoryReference("taskfiles");
            var blobs = (await taskFilesDirectory.ListBlobsSegmentedAsync(true, BlobListingDetails.All, 500, null, null, null)).Results;
            if (blobs == null)
            {
                return NotFound(new { fileError = "File(s) not found" });
            }

            List<string> attachmentNames = new List<string>();
            foreach (var item in blobs)
            {
                attachmentNames.Add((item as CloudBlob).Name);
            }

            return Ok(attachmentNames);
        }

        [HttpPost("uploadsolution/{taskId}/{studentId}")]
        public async Task<IActionResult> UploadSolution([FromRoute] int taskId, [FromRoute] int studentId)
        {

            var task = await _context.Task.SingleOrDefaultAsync(t => t.Id == taskId);
            if (task == null)
            {
                return NotFound(new { taskError = "Task not found" });
            }

            var business = await _context.Business.SingleOrDefaultAsync(b => b.Id == task.BusinessId);
            if (business == null)
            {
                return NotFound(new { businessError = "Business not found" });
            }

            var student = await _context.Student.SingleOrDefaultAsync(s => s.Id == studentId);
            if(student == null)
            {
                return NotFound(new { studentError = "Student not found" });
            }

            var httpRequest = HttpContext.Request;
            if (httpRequest.Form.Files.Count > 0)
            {
                foreach (var file in httpRequest.Form.Files)
                {
                    CloudBlobContainer container = blobClient.GetContainerReference("unifactoblobcontainer");
                    await container.CreateIfNotExistsAsync();
                    CloudBlobDirectory taskFilesDirectory = container.GetDirectoryReference("businesses").GetDirectoryReference(business.Id.ToString()).GetDirectoryReference("tasks").GetDirectoryReference(task.Id.ToString()).GetDirectoryReference("solutions").GetDirectoryReference(student.Id.ToString());

                    CloudBlockBlob blockBlob = container.GetBlockBlobReference(@"businesses/" + business.Id + @"/tasks/" + task.Id + @"/solutions/" + student.Id + @"/" + file.FileName);
                    await blockBlob.UploadFromStreamAsync(file.OpenReadStream());

                }
                return Ok();
            }

            return NotFound();
        }

        [HttpPost("deletesolution")]
        public async Task<IActionResult> DeleteSolution([FromBody] JObject obj)
        {
            int taskId = (int)obj["taskId"];
            int studentId = (int)obj["studentId"];
            string fileName = (string)obj["fileName"];

            var task = await _context.Task.SingleOrDefaultAsync(t => t.Id == taskId);
            if (task == null)
            {
                return NotFound(new { taskError = "Task not found" });
            }

            var business = await _context.Business.SingleOrDefaultAsync(b => b.Id == task.BusinessId);
            if (business == null)
            {
                return NotFound(new { businessError = "Business not found" });
            }

            var student = await _context.Student.SingleOrDefaultAsync(s => s.Id == studentId);
            if(student == null)
            {
                return NotFound(new { studentError = "Student not found" });
            }

            CloudBlobContainer container = blobClient.GetContainerReference("unifactoblobcontainer");
            await container.CreateIfNotExistsAsync();
            CloudBlobDirectory taskFilesDirectory = container.GetDirectoryReference("businesses").GetDirectoryReference(business.Id.ToString()).GetDirectoryReference("tasks").GetDirectoryReference(task.Id.ToString()).GetDirectoryReference("solutions").GetDirectoryReference(student.Id.ToString());
            CloudBlockBlob blobToDelete = taskFilesDirectory.GetBlockBlobReference(fileName);
            if (blobToDelete == null)
            {
                return NotFound(new { fileError = "File not found" });
            }
            await blobToDelete.DeleteAsync();
            return Ok();
        }
        [HttpGet("getsolutions/{taskId}/{studentId}")]
        public async Task<IActionResult> GetSolutions([FromRoute] int taskId, [FromRoute]int studentId)
        {
            var task = await _context.Task.SingleOrDefaultAsync(t => t.Id == taskId);
            if (task == null)
            {
                return NotFound(new { taskError = "Task not found" });
            }

            var business = await _context.Business.SingleOrDefaultAsync(b => b.Id == task.BusinessId);
            if (business == null)
            {
                return NotFound(new { businessError = "Busineess not found" });
            }

            var student = await _context.Student.SingleOrDefaultAsync(s => s.Id == studentId);
            if(student == null)
            {
                return NotFound(new { studentError = "Student not found" });
            }

            CloudBlobContainer container = blobClient.GetContainerReference("unifactoblobcontainer");
            CloudBlobDirectory taskFilesDirectory = container.GetDirectoryReference("businesses").GetDirectoryReference(business.Id.ToString()).GetDirectoryReference("tasks").GetDirectoryReference(task.Id.ToString()).GetDirectoryReference("solutions").GetDirectoryReference(student.Id.ToString());
            var blobs = (await taskFilesDirectory.ListBlobsSegmentedAsync(true, BlobListingDetails.All, 500, null, null, null)).Results;

            if (blobs == null)
            {
                return NotFound(new { fileError = "File(s) not found" });
            }

            return Ok(blobs);
        }
    }
}
